import * as express from "express";

import { Context } from "@azure/functions";
import { fromEither, taskify } from "fp-ts/lib/TaskEither";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { Second } from "italia-ts-commons/lib/units";
import * as jwt from "jsonwebtoken";
import { RedisClient } from "redis";
import { SuccessResponse } from "../generated/definitions/SuccessResponse";
import { SupportToken } from "../generated/definitions/SupportToken";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { InsertOrReplaceEntity, withAudit } from "../utils/audit_logs";
import { BLACKLIST_SUPPORT_TOKEN_PREFIX } from "../utils/citizen_id";
import {
  RequestCitizenToAdUserAndFiscalCode,
  RequestCitizenToFiscalCode
} from "../utils/middleware/citizen_id";
import { RequiredHeaderMiddleware } from "../utils/middleware/required_header";

type ResponseErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  supportToken: SupportToken,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<SuccessResponse> | ResponseErrorTypes>;

const ExpireJWT = t.exact(
  t.interface({
    exp: t.number
  })
);

export function BlacklistSupportTokenHandler(
  redisClient: RedisClient
): IHttpHandler {
  return async (context, supportToken, userAndCitizenId) => {
    return (
      fromEither(
        ExpireJWT.decode(jwt.decode(supportToken)).mapLeft(
          err => new Error(errorsToReadableMessages(err).join("|"))
        )
      )
        // Calculate remaining token validity
        .map(_ => (_.exp - Math.floor(new Date().valueOf() / 1000)) as Second)
        .chain(exp =>
          taskify<Error, "OK">(cb =>
            redisClient.set(
              `${BLACKLIST_SUPPORT_TOKEN_PREFIX}${supportToken}`,
              userAndCitizenId.fiscalCode,
              "EX",
              exp,
              cb
            )
          )()
        )
        .fold<IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>>(
          error => {
            context.log.error(
              `BlacklistSupportTokenHandler|ERROR|Error saving token into redis blacklist [${error}]`
            );
            return ResponseErrorInternal("Error saving token blacklist");
          },
          _ => ResponseSuccessJson({ message: _ })
        )
        .run()
    );
  };
}

export function BlacklistSupportToken(
  insertOrReplaceEntity: InsertOrReplaceEntity,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NumberFromString,
  redisClient: RedisClient
): express.RequestHandler {
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredHeaderMiddleware("x-citizen-id", SupportToken),
    RequestCitizenToFiscalCode(
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl,
      redisClient
    )
  );

  const handler = withAudit(insertOrReplaceEntity)(
    BlacklistSupportTokenHandler(redisClient),
    (context, _, { user, fiscalCode, citizenIdType }) => ({
      AuthLevel: "Support",
      Citizen: fiscalCode,
      Email: user.emails[0],
      OperationName: "BlacklistSupportToken",
      PartitionKey: user.oid,
      QueryParamType: citizenIdType,
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
