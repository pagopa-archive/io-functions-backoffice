import { fromPredicate, TaskEither } from "fp-ts/lib/TaskEither";
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
import { RedisClient } from "redis";
import { CitizenID } from "../generated/definitions/CitizenID";
import { SupportToken } from "../generated/definitions/SupportToken";
import { isAdminAuthLevel } from "./ad_user";
import { AdUser } from "./strategy/bearer_strategy";

const TokenPayload = t.interface({
  fiscalCode: FiscalCode
});

type TokenPayload = t.TypeOf<typeof TokenPayload>;

export const CitizenIDType = t.union([
  t.literal("FiscalCode"),
  t.literal("SupportToken")
]);

const FiscalCodeAndCitizenIdType = t.interface({
  citizenIdType: CitizenIDType,
  fiscalCode: FiscalCode
});

export type FiscalCodeAndCitizenIdType = t.TypeOf<
  typeof FiscalCodeAndCitizenIdType
>;

export const BLACKLIST_SUPPORT_TOKEN_PREFIX = "BLACKLIST-SUPPORT-TOKEN-";

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
  canQueryFiscalCodeGroup: NonEmptyString,
  redisClient: RedisClient
): TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
  FiscalCodeAndCitizenIdType
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
            : taskEither.of(
                FiscalCodeAndCitizenIdType.encode({
                  citizenIdType: "FiscalCode",
                  fiscalCode: citizenId
                })
              )
        )
    : verifySupportToken(publicRsaCertificate, citizenId)
        // Check if the token is backlisted
        .chain(_ =>
          taskify<Error, number>(cb =>
            redisClient.exists(
              `${BLACKLIST_SUPPORT_TOKEN_PREFIX}${citizenId}`,
              cb
            )
          )()
            .chain(
              fromPredicate(
                existsResponse => existsResponse === 0,
                () => new Error("Blacklisted support_token")
              )
            )
            .map(_1 => _)
            .mapLeft<
              IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation
            >(_1 => ResponseErrorForbiddenNotAuthorized)
        )
        .map(_ =>
          FiscalCodeAndCitizenIdType.encode({
            citizenIdType: "SupportToken",
            fiscalCode: _
          })
        );
