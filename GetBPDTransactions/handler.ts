import * as express from "express";

import { Context } from "@azure/functions";
import { Either } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { isNone, Option } from "fp-ts/lib/Option";
import { fromEither, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { readableReport } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { BPDTransaction } from "../generated/definitions/BPDTransaction";
import { BPDTransactionList } from "../generated/definitions/BPDTransactionList";
import { Transaction } from "../models/transaction";
import { OptionalHeaderMiddleware } from "../utils/middleware/optional_header";

type IHttpHandler = (
  context: Context,
  requestFiscalCode: Option<FiscalCode>
) => Promise<
  // tslint:disable-next-line: max-union-size
  | IResponseSuccessJson<BPDTransactionList>
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation
>;

// Convert model object to API object
export const toApiBPDTransactionList = (
  domainObj: ReadonlyArray<Transaction>
): Either<t.Errors, BPDTransactionList> => {
  return BPDTransactionList.decode({
    transactions: domainObj.map(transaction => {
      return {
        ...transaction,
        insert_date: transaction.insert_date?.toISOString(),
        trx_timestamp: transaction.trx_timestamp.toISOString(),
        update_date: transaction.update_date?.toISOString()
      } as BPDTransaction;
    })
  });
};

export function GetBPDTransactionsHandler(
  transactionRepository: TaskEither<Error, Repository<Transaction>>
): IHttpHandler {
  return async (context, requestFiscalCode) => {
    if (isNone(requestFiscalCode)) {
      return ResponseErrorValidation(
        "Bad request",
        "Missing fiscal code header"
      );
    }
    return transactionRepository
      .chain(transactions =>
        tryCatch(
          () => transactions.find({ fiscal_code: requestFiscalCode.value }),
          err => {
            context.log.error(
              `GetBPDTransactionsHandler|ERROR|Find citizen transactions query error [${err}]`
            );
            return new Error("Transactions find query error");
          }
        )
      )
      .mapLeft<IResponseErrorInternal | IResponseErrorValidation>(err =>
        ResponseErrorInternal(err.message)
      )
      .chain(transactionsData =>
        fromEither(toApiBPDTransactionList(transactionsData)).mapLeft(err =>
          ResponseErrorValidation(
            "Invalid BPDTransactionList object",
            readableReport(err)
          )
        )
      )
      .fold<
        // tslint:disable-next-line: max-union-size
        | IResponseErrorInternal
        | IResponseErrorValidation
        | IResponseSuccessJson<BPDTransactionList>
      >(identity, ResponseSuccessJson)
      .run();
  };
}

export function GetBPDTransactions(
  citizenRepository: TaskEither<Error, Repository<Transaction>>
): express.RequestHandler {
  const handler = GetBPDTransactionsHandler(citizenRepository);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    OptionalHeaderMiddleware("x-citizen-fiscal-code", FiscalCode)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
