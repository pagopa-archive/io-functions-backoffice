import { array, rights } from "fp-ts/lib/Array";
import { toError } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromNullable } from "fp-ts/lib/Option";
import { fromEither, taskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorFromValidationErrors,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import * as memcache from "memory-cache";
import { getGraphRbacManagementClient, IServicePrincipalCreds } from "../adb2c";

const getUserGroups = (
  userId: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  cacheTtl: NumberFromString
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
                tryCatch(() => client.groups.get(groupId), toError).map(_ =>
                  NonEmptyString.decode(_.displayName)
                )
              )
            )
          )
        )
        .map(rights)
        .chain(groupNames => {
          memcache.put(userId, groupNames, cacheTtl);
          return taskEither.of(groupNames);
        })
        .mapLeft(_ => ResponseErrorInternal(_.message)),
    (userGroups: readonly NonEmptyString[]) => taskEither.of(userGroups)
  );

const IUser = t.interface({
  oid: NonEmptyString
});
type IUser = t.TypeOf<typeof IUser>;

/**
 * Returns a request middleware that extract the required user profile
 * in request.user and map ADB2C user's groups.
 * @param type  The io-ts Type for validating the parameter
 */
export function RequiredExpressUserMiddleware<S, A>(
  type: t.Type<A, S>,
  adb2cCreds: IServicePrincipalCreds,
  cacheTtl: NumberFromString
): IRequestMiddleware<
  "IResponseErrorValidation" | "IResponseErrorInternal",
  A
> {
  return request => {
    return fromEither(type.decode(request.user))
      .mapLeft<IResponseErrorValidation | IResponseErrorInternal>(
        ResponseErrorFromValidationErrors(type)
      )
      .chain(decoded =>
        fromEither(IUser.decode(decoded))
          .mapLeft<IResponseErrorValidation | IResponseErrorInternal>(
            ResponseErrorFromValidationErrors(IUser)
          )
          .chain(iUser =>
            getUserGroups(iUser.oid, adb2cCreds, cacheTtl).map(groups =>
              type.encode({ ...decoded, groups })
            )
          )
      )
      .chain(_ =>
        fromEither(type.decode(_)).bimap(
          ResponseErrorFromValidationErrors(type),
          identity
        )
      )
      .run();
  };
}
