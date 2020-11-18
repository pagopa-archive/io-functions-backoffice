import * as express from "express";

import { Context } from "@azure/functions";
import { Either } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
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
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
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
import { CitizenID } from "../generated/definitions/CitizenID";
import { PaymentMethod } from "../generated/definitions/PaymentMethod";
import { Citizen } from "../models/citizen";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { withCitizenIdCheck } from "../utils/citizen_id";
import { RequiredExpressUserMiddleware } from "../utils/middleware/required_express_user";
import { RequiredHeaderMiddleware } from "../utils/middleware/required_header";
import { AdUser } from "../utils/strategy/bearer_strategy";

type ResponseErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  user: AdUser,
  citizenId: CitizenID
) => Promise<IResponseSuccessJson<BPDCitizen> | ResponseErrorTypes>;

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
          insert_date: citizen.insert_date?.toISOString(),
          insert_user: citizen.insert_user,
          payment_methods: PaymentMethod.is(citizen) ? [citizen] : [],
          timestamp_tc: citizen.timestamp_tc.toISOString(),
          update_date: citizen.update_date?.toISOString(),
          update_user: citizen.update_user,

          payoff_instr: citizen.payoff_instr
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
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NonNegativeInteger
): IHttpHandler {
  return async (context, _, citizenId) => {
    return withCitizenIdCheck(
      _.oid,
      citizenId,
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl,
      requestFiscalCode =>
        citizenRepository
          .chain(citizen =>
            tryCatch(
              () => citizen.find({ fiscal_code: requestFiscalCode }),
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
    )
      .fold<ResponseErrorTypes | IResponseSuccessJson<BPDCitizen>>(
        identity,
        identity
      )
      .run();
  };
}

export function GetBPDCitizen(
  citizenRepository: TaskEither<Error, Repository<Citizen>>,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NonNegativeInteger
): express.RequestHandler {
  const handler = GetBPDCitizenHandler(
    citizenRepository,
    publicRsaCertificate,
    adb2cCreds,
    adb2cAdminGroup,
    cacheTtl
  );

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredExpressUserMiddleware(AdUser),
    RequiredHeaderMiddleware("x-citizen-id", CitizenID)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
