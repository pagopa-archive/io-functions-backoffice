import { identity } from "fp-ts/lib/function";
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

const TokenPayload = t.interface({
  fiscalCode: FiscalCode
});

type TokenPayload = t.TypeOf<typeof TokenPayload>;

type CitizenIDCheckReturnType =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorValidation;

const verifySupportToken = (pubCert: NonEmptyString, token: SupportToken) =>
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

export const withCitizenIdCheck = async <T>(
  citizenId: CitizenID,
  publicRsaCertificate: NonEmptyString,
  f: (fiscalCode: FiscalCode) => Promise<T>
) =>
  // TODO insert group check in case of FiscalCode used by non admin users
  FiscalCode.is(citizenId)
    ? taskEither
        .of<IResponseErrorForbiddenNotAuthorized, FiscalCode>(citizenId)
        .map(_ => f(_))
        .fold<CitizenIDCheckReturnType | Promise<T>>(identity, identity)
        .run()
    : verifySupportToken(publicRsaCertificate, citizenId)
        .map(_ => f(_))
        .fold<CitizenIDCheckReturnType | Promise<T>>(identity, identity)
        .run();
