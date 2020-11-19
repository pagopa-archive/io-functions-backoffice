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
import { NumberFromString } from "italia-ts-commons/lib/numbers";
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
import { Transaction } from "../models/transaction";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { InsertOrReplaceEntity, withAudit } from "../utils/audit_logs";
import {
  RequestCitizenToAdUserAndFiscalCode,
  RequestCitizenToFiscalCode
} from "../utils/middleware/citizen_id";

type ErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<BPDTransactionList> | ErrorTypes>;

// Convert model object to API object
export const toApiBPDTransactionList = (
  domainObj: ReadonlyArray<Transaction>
): Either<t.Errors, BPDTransactionList> => {
  return BPDTransactionList.decode({
    transactions: domainObj.map(transaction => {
      return {
        ...transaction,
        acquirer_descr: transaction.acquirer, // TODO: It's an enum type
        amount_currency_descr: "EUR", // TODO: fixed to 978 = EUR
        circuit_type_descr: transaction.circuit_type, // TODO: It's an enum type
        insert_date: transaction.insert_date?.toISOString(),
        operation_type_descr: transaction.operation_type, // TODO: It's an enum type
        payment_instrument_insert_date: transaction.payment_instrument_insert_date?.toISOString(),
        payment_instrument_update_date: transaction.payment_instrument_update_date?.toISOString(),
        trx_timestamp: transaction.trx_timestamp.toISOString(),
        update_date: transaction.update_date?.toISOString()
      } as BPDTransaction;
    })
  });
};

export function GetBPDTransactionsHandler(
  transactionRepository: TaskEither<Error, Repository<Transaction>>
): IHttpHandler {
  return async (context, userAndfiscalCode) => {
    return transactionRepository
      .chain(transactions =>
        tryCatch(
          () =>
            transactions.find({ fiscal_code: userAndfiscalCode.fiscalCode }),
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

      .fold<ErrorTypes | IResponseSuccessJson<BPDTransactionList>>(
        identity,
        ResponseSuccessJson
      )
      .run();
  };
}

export function GetBPDTransactions(
  citizenRepository: TaskEither<Error, Repository<Transaction>>,
  insertOrReplaceEntity: InsertOrReplaceEntity,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NumberFromString
): express.RequestHandler {
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequestCitizenToFiscalCode(
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl
    )
  );

  const handler = withAudit(insertOrReplaceEntity)(
    GetBPDTransactionsHandler(citizenRepository),
    (context, { user, fiscalCode }) => ({
      AuthLevel: "Admin",
      Citizen: fiscalCode,
      OperationName: "GetBPDCitizen",
      PartitionKey: user.oid, // Can we use email?
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
