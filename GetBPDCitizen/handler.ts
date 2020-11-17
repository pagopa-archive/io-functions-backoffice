import * as express from "express";

import { Context } from "@azure/functions";
import { isEmpty } from "fp-ts/lib/Array";
import { Either, fromOption } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { Option } from "fp-ts/lib/Option";
import {
  fromEither,
  fromPredicate,
  TaskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
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
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { BPDCitizen } from "../generated/definitions/BPDCitizen";
import { PaymentMethod } from "../generated/definitions/PaymentMethod";
import { Citizen } from "../models/citizen";
import { AuditLogTableRow, InsertOrReplaceEntity } from "../utils/audit_logs";
import { OptionalHeaderMiddleware } from "../utils/middleware/optional_header";
import { RequiredExpressUserMiddleware } from "../utils/middleware/required_express_user";
import { AdUser } from "../utils/strategy/bearer_strategy";

type IHttpHandler = (
  context: Context,
  user: AdUser,
  requestFiscalCode: Option<FiscalCode>
) => Promise<
  // tslint:disable-next-line: max-union-size
  | IResponseSuccessJson<BPDCitizen>
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation
>;

// Convert model object to API object
export const toApiBPDCitizen = (
  domainObj: ReadonlyArray<Citizen>
): Either<t.Errors, BPDCitizen> => {
  return BPDCitizen.decode(
    domainObj.reduce((acc: BPDCitizen | undefined, citizen) => {
      if (acc === undefined) {
        return {
          citizen_enabled: citizen.citizen_enabled,
          fiscal_code: citizen.fiscal_code,
          onboarding_date: citizen.onboarding_date?.toISOString(),
          onboarding_issuer_id: citizen.onboarding_issuer_id,
          payment_methods: PaymentMethod.is(citizen) ? [citizen] : [],
          timestamp_tc: citizen.timestamp_tc.toISOString(),
          update_date: citizen.update_date?.toISOString(),
          update_user: citizen.update_user,

          pay_off_instr: citizen.pay_off_instr
        };
      }
      if (PaymentMethod.is(citizen)) {
        return {
          ...acc,
          payment_methods: [...acc.payment_methods, citizen]
        };
      }
      return acc;
    }, undefined)
  );
};

export function GetBPDCitizenHandler(
  citizenRepository: TaskEither<Error, Repository<Citizen>>,
  insertOrReplaceEntity: InsertOrReplaceEntity
): IHttpHandler {
  return async (context, _, requestFiscalCode) => {
    return fromEither<
      | IResponseErrorInternal
      | IResponseErrorValidation
      | IResponseErrorNotFound,
      FiscalCode
    >(
      fromOption(
        ResponseErrorValidation("Bad request", "Missing fiscal code header")
      )(requestFiscalCode)
    )
      .chain(fiscalCode => {
        const logTableRow: AuditLogTableRow = {
          AuthLevel: "Admin",
          Citizen: fiscalCode,
          OperationName: "GetBPDCitizen",
          PartitionKey: _.oid, // Can we use email?
          RowKey: context.executionContext.invocationId as string &
            NonEmptyString
        };
        return insertOrReplaceEntity(logTableRow)
          .chain(_1 => citizenRepository)
          .chain(citizen =>
            tryCatch(
              () => citizen.find({ fiscal_code: fiscalCode }),
              err => {
                context.log.error(
                  `GetUserHandler|ERROR|Find citizen query error [${err}]`
                );
                return new Error("Citizen find query error");
              }
            )
          )
          .mapLeft<
            | IResponseErrorInternal
            | IResponseErrorNotFound
            | IResponseErrorValidation
          >(err => ResponseErrorInternal(err.message));
      })
      .chain(
        fromPredicate(
          citizenData => !isEmpty(citizenData),
          () => ResponseErrorNotFound("Not found", "Citizen not found")
        )
      )
      .chain(citizenData =>
        fromEither(toApiBPDCitizen(citizenData)).mapLeft(err =>
          ResponseErrorValidation(
            "Invalid BPDCitizen object",
            readableReport(err)
          )
        )
      )
      .fold<
        // tslint:disable-next-line: max-union-size
        | IResponseErrorInternal
        | IResponseErrorNotFound
        | IResponseErrorValidation
        | IResponseSuccessJson<BPDCitizen>
      >(identity, ResponseSuccessJson)
      .run();
  };
}

export function GetBPDCitizen(
  citizenRepository: TaskEither<Error, Repository<Citizen>>,
  insertOrReplaceEntity: InsertOrReplaceEntity
): express.RequestHandler {
  const handler = GetBPDCitizenHandler(
    citizenRepository,
    insertOrReplaceEntity
  );

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredExpressUserMiddleware(AdUser),
    OptionalHeaderMiddleware("x-citizen-fiscal-code", FiscalCode)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
