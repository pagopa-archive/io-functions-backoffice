import { TaskEither } from "fp-ts/lib/TaskEither";
import { fromEither, fromLeft } from "fp-ts/lib/TaskEither";
import { taskEither } from "fp-ts/lib/TaskEither";
import { taskify } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorValidation,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import * as jwt from "jsonwebtoken";
import { CitizenID } from "../generated/definitions/CitizenID";
import { SupportToken } from "../generated/definitions/SupportToken";
import { isAdminAuthLevel } from "./ad_user";
import { AdUser } from "./strategy/bearer_strategy";

const TokenPayload = t.interface({
  fiscalCode: FiscalCode
});

type TokenPayload = t.TypeOf<typeof TokenPayload>;

const verifySupportToken = (
  pubCert: NonEmptyString,
  token: SupportToken
): TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
  FiscalCode
> =>
  taskify<jwt.VerifyErrors, object>(cb =>
    jwt.verify(token, pubCert, { algorithms: ["RS256"] }, cb)
  )()
    .mapLeft(_ => ResponseErrorForbiddenNotAuthorized)
    .foldTaskEither<
      IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
      FiscalCode
    >(fromLeft, _ =>
      fromEither(TokenPayload.decode(_)).bimap(
        () =>
          ResponseErrorValidation(
            "Bad Request",
            "Support token payload invalid"
          ),
        payload => payload.fiscalCode
      )
    );

export const withCitizenIdCheck = (
  adUser: AdUser,
  citizenId: CitizenID,
  publicRsaCertificate: NonEmptyString,
  canQueryFiscalCodeGroup: NonEmptyString
): TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
  FiscalCode
> =>
  FiscalCode.is(citizenId)
    ? taskEither
        .of<
          IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
          boolean
        >(isAdminAuthLevel(adUser, canQueryFiscalCodeGroup))
        .chain(isAdmin =>
          !isAdmin
            ? fromLeft(ResponseErrorForbiddenNotAuthorized)
            : taskEither.of(citizenId)
        )
    : verifySupportToken(publicRsaCertificate, citizenId);
