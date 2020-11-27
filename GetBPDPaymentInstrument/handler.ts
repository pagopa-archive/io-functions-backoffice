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
import { RequiredParamMiddleware } from "io-functions-commons/dist/src/utils/middlewares/required_param";
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
import { PaymentMethodDetails } from "../generated/definitions/PaymentMethodDetails";
import { PaymentIntrument } from "../models/payment_instrument";
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
  hpan: NonEmptyString,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<PaymentMethodDetails> | ResponseErrorTypes>;

function toApiPaymentInstrumentDetail(
  paymentIntruments: ReadonlyArray<PaymentIntrument>
): Either<t.Errors, PaymentMethodDetails> {
  return PaymentMethodDetails.decode(
    paymentIntruments.reduce((acc: undefined | PaymentMethodDetails, pi) => {
      if (acc === undefined) {
        return {
          ...pi,
          activation_periods: [
            {
              ...pi,
              cancellation: pi.cancellation?.toISOString(),
              enrollment: pi.enrollment.toISOString(),
              paym_istr_hist_insert_date: pi.paym_istr_hist_insert_date?.toISOString(),
              paym_istr_hist_update_date: pi.paym_istr_hist_update_date?.toISOString()
            }
          ],
          paym_istr_insert_date: pi.paym_istr_insert_date?.toISOString(),
          paym_istr_update_date: pi.paym_istr_update_date?.toISOString()
        } as PaymentMethodDetails;
      }
      return {
        ...acc,
        activation_periods: [
          ...acc.activation_periods,
          {
            ...pi,
            cancellation: pi.cancellation?.toISOString(),
            enrollment: pi.enrollment.toISOString(),
            paym_istr_hist_insert_date: pi.paym_istr_hist_insert_date?.toISOString(),
            paym_istr_hist_update_date: pi.paym_istr_hist_update_date?.toISOString()
          }
        ]
      } as PaymentMethodDetails;
    }, undefined)
  );
}

export function GetBPDPaymentInstrumentHandler(
  paymentInstrumentRepo: TaskEither<Error, Repository<PaymentIntrument>>
): IHttpHandler {
  return async (context, hpan, userAndfiscalCode) => {
    return paymentInstrumentRepo
      .chain(paymentInstrument =>
        tryCatch(
          () =>
            paymentInstrument.find({
              order: {
                enrollment: "ASC"
              },
              where: {
                fiscal_code: userAndfiscalCode.fiscalCode,
                hpan
              }
            }),
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
          paymentInstrumentData => paymentInstrumentData.length > 0,
          () =>
            ResponseErrorNotFound("Not found", "Payment Intrument not found")
        )
      )
      .chain(paymentInstrumentData =>
        fromEither(
          toApiPaymentInstrumentDetail(paymentInstrumentData)
        ).mapLeft(err =>
          ResponseErrorValidation(
            "Invalid PaymentInstrumentDetail object",
            readableReport(err)
          )
        )
      )
      .map(ResponseSuccessJson)
      .fold<ResponseErrorTypes | IResponseSuccessJson<PaymentMethodDetails>>(
        identity,
        identity
      )
      .run();
  };
}

export function GetBPDPaymentInstrument(
  paymentInstrumentRepo: TaskEither<Error, Repository<PaymentIntrument>>,
  insertOrReplaceEntity: InsertOrReplaceEntity,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NumberFromString
): express.RequestHandler {
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("hpan", NonEmptyString),
    RequestCitizenToFiscalCode(
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl
    )
  );

  const handler = withAudit(insertOrReplaceEntity)(
    GetBPDPaymentInstrumentHandler(paymentInstrumentRepo),
    (context, _, { user, fiscalCode, citizenIdType }) => ({
      AuthLevel: isAdminAuthLevel(user, adb2cAdminGroup) ? "Admin" : "Support",
      Citizen: fiscalCode,
      Email: user.emails[0],
      OperationName: "GetBPDPaymentInstruments",
      PartitionKey: user.oid, // Can we use email?
      QueryParamType: citizenIdType,
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
