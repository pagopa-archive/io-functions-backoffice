import * as express from "express";

import { Context } from "@azure/functions";
import { isEmpty } from "fp-ts/lib/Array";
import { Either, isLeft } from "fp-ts/lib/Either";
import { isNone, Option } from "fp-ts/lib/Option";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
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
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { BPDCitizen } from "../generated/definitions/BPDCitizen";
import { PaymentMethod } from "../generated/definitions/PaymentMethod";
import { Citizen } from "../models/citizen";
import { OptionalHeaderMiddleware } from "../utils/middleware/optional_header";

type IHttpHandler = (
  context: Context,
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
  citizenRepository: TaskEither<Error, Repository<Citizen>>
): IHttpHandler {
  return async (context, requestFiscalCode) => {
    if (isNone(requestFiscalCode)) {
      return ResponseErrorValidation(
        "Bad request",
        "Missing fiscal code header"
      );
    }
    const errorOrCitizenData = await citizenRepository
      .chain(citizen =>
        tryCatch(
          () => citizen.find({ fiscal_code: requestFiscalCode.value }),
          err => {
            context.log.error(
              `GetUserHandler|ERROR|Find citizen query error [${err}]`
            );
            return new Error("Citizen find query error");
          }
        )
      )
      .run();
    if (isLeft(errorOrCitizenData)) {
      return ResponseErrorInternal(errorOrCitizenData.value.message);
    }
    if (isEmpty(errorOrCitizenData.value)) {
      return ResponseErrorNotFound("Not found", "Citizen not found");
    }
    return toApiBPDCitizen(errorOrCitizenData.value).fold<
      IResponseErrorValidation | IResponseSuccessJson<BPDCitizen>
    >(
      err =>
        ResponseErrorValidation(
          "Invalid BPDCitizen object",
          readableReport(err)
        ),
      bpdCitizen => ResponseSuccessJson(bpdCitizen)
    );
  };
}

export function GetBPDCitizen(
  citizenRepository: TaskEither<Error, Repository<Citizen>>
): express.RequestHandler {
  const handler = GetBPDCitizenHandler(citizenRepository);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    OptionalHeaderMiddleware("x-citizen-fiscal-code", FiscalCode)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
