import * as express from "express";

import { Context } from "@azure/functions";
import { Either } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromEither, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { readableReport } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { BPDTransaction } from "../generated/definitions/BPDTransaction";
import { BPDTransactionList } from "../generated/definitions/BPDTransactionList";
import { CitizenID } from "../generated/definitions/CitizenID";
import { Transaction } from "../models/transaction";
import { withCitizenIdCheck } from "../utils/citizen_id";
import { RequiredHeaderMiddleware } from "../utils/middleware/required_header";

type ErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  citizenId: CitizenID
) => Promise<IResponseSuccessJson<BPDTransactionList> | ErrorTypes>;

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
  transactionRepository: TaskEither<Error, Repository<Transaction>>,
  publicRsaCertificate: NonEmptyString
): IHttpHandler {
  return async (context, citizenId) => {
    return withCitizenIdCheck(citizenId, publicRsaCertificate, fiscalCode =>
      transactionRepository
        .chain(transactions =>
          tryCatch(
            () => transactions.find({ fiscal_code: fiscalCode }),
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
    )
      .fold<ErrorTypes | IResponseSuccessJson<BPDTransactionList>>(
        identity,
        ResponseSuccessJson
      )
      .run();
  };
}

export function GetBPDTransactions(
  citizenRepository: TaskEither<Error, Repository<Transaction>>,
  publicRsaCertificate: NonEmptyString
): express.RequestHandler {
  const handler = GetBPDTransactionsHandler(
    citizenRepository,
    publicRsaCertificate
  );

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredHeaderMiddleware("x-citizen-id", CitizenID)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
