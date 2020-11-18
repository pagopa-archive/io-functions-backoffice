import { toError } from "fp-ts/lib/Either";
import { fromEither, fromLeft, tryCatch } from "fp-ts/lib/TaskEither";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { CitizenID } from "../../generated/definitions/CitizenID";
import { IServicePrincipalCreds } from "../adb2c";
import { withCitizenIdCheck } from "../citizen_id";
import { AdUser } from "../strategy/bearer_strategy";
import { RequiredExpressUserMiddleware } from "./required_express_user";
import { RequiredHeaderMiddleware } from "./required_header";

const RequestCitizenToOidAndFiscalCode = t.interface({
  fiscalCode: FiscalCode,
  oid: NonEmptyString
});

export type RequestCitizenToOidAndFiscalCode = t.TypeOf<
  typeof RequestCitizenToOidAndFiscalCode
>;

/**
 * Perform validation on an incoming request assuring that
 * - a CitizenID header is provided in the correct format
 * - the CitizenID is a valid JWT
 * - the CitizenID value is resolved into a valid FiscalCode
 *
 * @param publicRsaCertificate RSA certificate to validate JWT signature
 * @param headerName (optional) the header in which we expect the value, default: "x-citizen-id"
 *
 * @returns Either the resolved fiscal code or a proper error
 */
export const RequestCitizenToFiscalCode = (
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NonNegativeInteger,
  headerName = "x-citizen-id"
): IRequestMiddleware<
  | "IResponseErrorValidation"
  | "IResponseErrorForbiddenNotAuthorized"
  | "IResponseErrorInternal",
  RequestCitizenToOidAndFiscalCode
> => async request => {
  return (
    tryCatch(
      () => RequiredExpressUserMiddleware(AdUser)(request),
      err => ResponseErrorValidation(`Invalid AdUser`, toError(err).message)
    )
      .chain(fromEither)
      // validate the header is present and its value is in the correct shape
      .chain(_ =>
        tryCatch(
          () => RequiredHeaderMiddleware(headerName, CitizenID)(request),
          e =>
            ResponseErrorValidation(
              `Invalid ${headerName} header`,
              toError(e).message
            )
        )
          .chain(fromEither)
          .map(citizenId => ({
            citizenId,
            oid: _.oid
          }))
      )
      // validate the value is either a fiscal code or a valid JWT. In the latter case, the fiscal code is resolved
      .foldTaskEither<
        | IResponseErrorValidation
        | IResponseErrorForbiddenNotAuthorized
        | IResponseErrorInternal,
        RequestCitizenToOidAndFiscalCode
      >(fromLeft, ({ citizenId, oid }) =>
        withCitizenIdCheck(
          oid,
          citizenId,
          publicRsaCertificate,
          adb2cCreds,
          adb2cAdminGroup,
          cacheTtl
        ).map(__ => ({ oid, fiscalCode: __ }))
      )
      .run()
  );
};
