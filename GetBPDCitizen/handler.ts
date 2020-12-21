import * as express from "express";

import { Context } from "@azure/functions";
import { Either } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromNullable, isSome, Option } from "fp-ts/lib/Option";
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
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import { readableReport } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { BPDCitizen } from "../generated/definitions/BPDCitizen";
import { PaymentMethod } from "../generated/definitions/PaymentMethod";
import { Citizen } from "../models/citizen";
import { isAdminAuthLevel } from "../utils/ad_user";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { InsertOrReplaceEntity, withAudit } from "../utils/audit_logs";
import {
  RequestCitizenToAdUserAndFiscalCode,
  RequestCitizenToFiscalCode
} from "../utils/middleware/citizen_id";

type ResponseErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<BPDCitizen> | ResponseErrorTypes>;

// Convert model object to API object
export const toApiBPDCitizen = (
  domainObj: ReadonlyArray<Citizen>
): Either<t.Errors, BPDCitizen> => {
  return BPDCitizen.decode(
    domainObj.reduce((acc: BPDCitizen | undefined, citizen) => {
      const paymentMethod: Option<PaymentMethod> = fromNullable(
        citizen.payment_instrument_hpan
      )
        .chain(hpan =>
          fromNullable(citizen.payment_instrument_status).map(status => ({
            hpan,
            status
          }))
        )
        .map(
          p =>
            ({
              ...citizen,
              payment_instrument_hpan: p.hpan,
              payment_instrument_insert_date: citizen.payment_instrument_insert_date?.toISOString(),
              payment_instrument_status: p.status,
              payment_instrument_update_date: citizen.payment_instrument_update_date?.toISOString()
            } as PaymentMethod)
        );
      if (acc === undefined) {
        return {
          cancellation: citizen.cancellation?.toISOString(),
          checkiban_fiscal_code: citizen.checkiban_fiscal_code,
          checkiban_name: citizen.checkiban_name,
          checkiban_status: citizen.checkiban_status,
          checkiban_surname: citizen.checkiban_surname,
          enabled: citizen.enabled,
          fiscal_code: citizen.fiscal_code,
          insert_date: citizen.insert_date?.toISOString(),
          insert_user: citizen.insert_user,
          payment_methods: isSome(paymentMethod) ? [paymentMethod.value] : [],
          payoff_instr: citizen.payoff_instr,
          payoff_instr_type: citizen.payoff_instr_type,
          timestamp_tc: citizen.timestamp_tc.toISOString(),
          update_date: citizen.update_date?.toISOString(),
          update_user: citizen.update_user
        };
      }
      if (isSome(paymentMethod)) {
        return {
          ...acc,
          payment_methods: [...acc.payment_methods, paymentMethod.value]
        };
      }
      return acc;
    }, undefined)
  );
};

export function GetBPDCitizenHandler(
  citizenRepository: TaskEither<Error, Repository<Citizen>>
): IHttpHandler {
  return async (context, userAndfiscalCode) => {
    return citizenRepository
      .chain(citizen =>
        tryCatch(
          () => citizen.find({ fiscal_code: userAndfiscalCode.fiscalCode }),
          (err: unknown) => {
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
      >(err => ResponseErrorInternal(err.message))
      .chain(
        fromPredicate(
          citizenData => citizenData.length > 0,
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
      .map(ResponseSuccessJson)
      .fold<ResponseErrorTypes | IResponseSuccessJson<BPDCitizen>>(
        identity,
        identity
      )
      .run();
  };
}

export function GetBPDCitizen(
  citizenRepository: TaskEither<Error, Repository<Citizen>>,
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
    GetBPDCitizenHandler(citizenRepository),
    (context, { user, fiscalCode, citizenIdType }) => ({
      AuthLevel: isAdminAuthLevel(user, adb2cAdminGroup) ? "Admin" : "Support",
      Citizen: fiscalCode,
      Email: user.emails[0],
      OperationName: "GetBPDCitizen",
      PartitionKey: user.oid,
      QueryParamType: citizenIdType,
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
