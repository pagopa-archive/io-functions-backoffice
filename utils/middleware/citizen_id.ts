import { toError } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromEither, fromLeft, tryCatch } from "fp-ts/lib/TaskEither";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { RedisClient } from "redis";
import { CitizenID } from "../../generated/definitions/CitizenID";
import { CitizenIDType } from "../../utils/citizen_id";
import { IServicePrincipalCreds } from "../adb2c";
import { withCitizenIdCheck } from "../citizen_id";
import { AdUser } from "../strategy/bearer_strategy";
import { RequiredExpressUserMiddleware } from "./required_express_user";
import { RequiredHeaderMiddleware } from "./required_header";

const RequestCitizenToAdUserAndFiscalCode = t.interface({
  citizenIdType: CitizenIDType,
  fiscalCode: FiscalCode,
  user: AdUser
});

export type RequestCitizenToAdUserAndFiscalCode = t.TypeOf<
  typeof RequestCitizenToAdUserAndFiscalCode
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
  cacheTtl: NumberFromString,
  redisClient: RedisClient,
  headerName = "x-citizen-id"
): IRequestMiddleware<
  | "IResponseErrorValidation"
  | "IResponseErrorForbiddenNotAuthorized"
  | "IResponseErrorInternal",
  RequestCitizenToAdUserAndFiscalCode
> => async request => {
  return (
    // validate AdUser is present and its value is in the correct shape
    tryCatch(
      () =>
        RequiredExpressUserMiddleware(AdUser, adb2cCreds, cacheTtl)(request),
      err => ResponseErrorValidation(`Invalid AdUser`, toError(err).message)
    )
      .mapLeft<IResponseErrorValidation | IResponseErrorInternal>(identity)
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
            user: _
          }))
      )
      // validate the value is either a fiscal code or a valid JWT. In the latter case, the fiscal code is resolved
      .foldTaskEither<
        | IResponseErrorValidation
        | IResponseErrorForbiddenNotAuthorized
        | IResponseErrorInternal,
        RequestCitizenToAdUserAndFiscalCode
      >(fromLeft, ({ citizenId, user }) =>
        withCitizenIdCheck(
          user,
          citizenId,
          publicRsaCertificate,
          adb2cAdminGroup,
          redisClient
        ).map(fiscalCodeAndCitizenIdType => ({
          ...fiscalCodeAndCitizenIdType,
          user
        }))
      )
      .run()
  );
};
