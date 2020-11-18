import { array } from "fp-ts/lib/Array";
import { toError } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { fromEither, fromLeft } from "fp-ts/lib/TaskEither";
import { taskEither } from "fp-ts/lib/TaskEither";
import { taskify } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import * as jwt from "jsonwebtoken";
import * as memcache from "memory-cache";
import { CitizenID } from "../generated/definitions/CitizenID";
import { SupportToken } from "../generated/definitions/SupportToken";
import { getGraphRbacManagementClient, IServicePrincipalCreds } from "./adb2c";

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

const checkUserGroups = (
  userId: NonEmptyString,
  adminGroup: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  cacheTtl: NonNegativeInteger
) =>
  fromNullable(memcache.get(userId)).foldL(
    () =>
      getGraphRbacManagementClient(adb2cCreds)
        .chain(client =>
          tryCatch(
            () =>
              client.users.getMemberGroups(userId, {
                securityEnabledOnly: true
              }),
            toError
          ).chain(response =>
            array.sequence(taskEither)(
              response.map(groupId =>
                tryCatch(() => client.groups.get(groupId), toError).map(
                  _ => _.displayName
                )
              )
            )
          )
        )
        .chain(groupNames => {
          memcache.put(userId, groupNames, cacheTtl);
          return taskEither.of(groupNames.includes(adminGroup));
        })
        .mapLeft(_ => ResponseErrorInternal(_.message)),
    (userGroups: readonly NonEmptyString[]) =>
      taskEither.of(userGroups.includes(adminGroup))
  );

export const withCitizenIdCheck = <T, S>(
  userId: NonEmptyString,
  citizenId: CitizenID,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  canQueryFiscalCodeGroup: NonEmptyString,
  cacheTtl: NonNegativeInteger,
  f: (fiscalCode: FiscalCode) => TaskEither<T, S>
) =>
  // TODO insert group check in case of FiscalCode used by non admin users
  FiscalCode.is(citizenId)
    ? checkUserGroups(userId, canQueryFiscalCodeGroup, adb2cCreds, cacheTtl)
        .foldTaskEither<
          IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal | T,
          FiscalCode
        >(fromLeft, isAdmin =>
          !isAdmin
            ? fromLeft(ResponseErrorForbiddenNotAuthorized)
            : taskEither.of(citizenId)
        )
        .chain(_ => f(_))
    : verifySupportToken(publicRsaCertificate, citizenId).foldTaskEither<
        T | IResponseErrorForbiddenNotAuthorized | IResponseErrorValidation,
        S
      >(fromLeft, _ => f(_));
