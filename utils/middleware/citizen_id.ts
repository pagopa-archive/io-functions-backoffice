import { toError } from "fp-ts/lib/Either";
import { fromEither, taskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorValidation,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { CitizenID } from "../../generated/definitions/CitizenID";
import { withCitizenIdCheck } from "../citizen_id";
import { RequiredHeaderMiddleware } from "./required_header";

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
  headerName = "x-citizen-id"
): IRequestMiddleware<
  "IResponseErrorValidation" | "IResponseErrorForbiddenNotAuthorized",
  FiscalCode
> => async request => {
  return (
    // validate the header is present and its value is in the correct shape
    tryCatch(
      () => RequiredHeaderMiddleware(headerName, CitizenID)(request),
      e =>
        ResponseErrorValidation(
          `Invalid ${headerName} header`,
          toError(e).message
        ) as IResponseErrorValidation | IResponseErrorForbiddenNotAuthorized
    )
      .chain(fromEither)
      // validate the value is either a fiscal code or a valid JWT. In the latter case, the fiscal code is resolved
      .chain(c =>
        withCitizenIdCheck(c, publicRsaCertificate, fiscalCode =>
          taskEither.of(fiscalCode)
        ).mapLeft(_ => ResponseErrorForbiddenNotAuthorized)
      )
      .run()
  );
};
