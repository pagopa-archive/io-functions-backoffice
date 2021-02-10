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
import { RedisClient } from "redis";
import { Repository } from "typeorm";
import { AwardsList } from "../generated/definitions/AwardsList";
import { Award } from "../models/award";
import { isAdminAuthLevel } from "../utils/ad_user";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { InsertOrReplaceEntity, withAudit } from "../utils/audit_logs";
import {
  RequestCitizenToAdUserAndFiscalCode,
  RequestCitizenToFiscalCode
} from "../utils/middleware/citizen_id";

export const toApiBPDAward = (
  domainObj: ReadonlyArray<Award>
): Either<t.Errors, AwardsList> => {
  return AwardsList.decode(
    domainObj.reduce((acc: AwardsList | undefined, award) => {
      if (acc === undefined) {
        return award.award_period_id === undefined
          ? ({
              awards: [],
              fiscal_code: award.fiscal_code
            } as AwardsList)
          : ({
              awards: [
                {
                  ...award,
                  award_period_end: award.award_period_end.toISOString(),
                  award_period_insert_date: award.award_period_insert_date?.toISOString(),
                  award_period_start: award.award_period_start.toISOString(),
                  award_period_update_date: award.award_period_update_date?.toISOString(),
                  award_winner_insert_date: award.award_winner_insert_date?.toISOString(),
                  award_winner_period_end: award.award_winner_period_end?.toISOString(),
                  award_winner_period_start: award.award_winner_period_start?.toISOString(),
                  award_winner_update_date: award.award_winner_update_date?.toISOString(),
                  citizen_ranking_insert_date: award.citizen_ranking_insert_date?.toISOString(),
                  citizen_ranking_ranking_date: award.citizen_ranking_ranking_date?.toISOString(),
                  citizen_ranking_update_date: award.citizen_ranking_update_date?.toISOString()
                }
              ],
              fiscal_code: award.fiscal_code
            } as AwardsList);
      }
      return {
        ...acc,
        awards: [
          ...acc.awards,
          {
            ...award,
            award_period_end: award.award_period_end.toISOString(),
            award_period_insert_date: award.award_period_insert_date?.toISOString(),
            award_period_start: award.award_period_start.toISOString(),
            award_period_update_date: award.award_period_update_date?.toISOString(),
            award_winner_insert_date: award.award_winner_insert_date?.toISOString(),
            award_winner_period_end: award.award_winner_period_end?.toISOString(),
            award_winner_period_start: award.award_winner_period_start?.toISOString(),
            award_winner_update_date: award.award_winner_update_date?.toISOString(),
            citizen_ranking_insert_date: award.citizen_ranking_insert_date?.toISOString(),
            citizen_ranking_ranking_date: award.citizen_ranking_ranking_date?.toISOString(),
            citizen_ranking_update_date: award.citizen_ranking_update_date?.toISOString()
          }
        ]
      } as AwardsList;
    }, undefined)
  );
};

type ResponseErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<AwardsList> | ResponseErrorTypes>;

export function GetBPDAwardsHandler(
  awardRepository: TaskEither<Error, Repository<Award>>
): IHttpHandler {
  return async (context, userAndfiscalCode) => {
    return awardRepository
      .chain(award =>
        tryCatch(
          () => award.find({ fiscal_code: userAndfiscalCode.fiscalCode }),
          (err: unknown) => {
            context.log.error(
              `GetBPDAwardsHandler|ERROR|Find awards query error [${err}]`
            );
            return new Error("Award find query error");
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
          awardData => awardData.length > 0,
          () => ResponseErrorNotFound("Not found", "Awards not found")
        )
      )
      .chain(awardData =>
        fromEither(toApiBPDAward(awardData)).mapLeft(err =>
          ResponseErrorValidation(
            "Invalid AwardsList object",
            readableReport(err)
          )
        )
      )
      .fold<ResponseErrorTypes | IResponseSuccessJson<AwardsList>>(
        identity,
        ResponseSuccessJson
      )
      .run();
  };
}

export function GetBPDAwards(
  citizenRepository: TaskEither<Error, Repository<Award>>,
  insertOrReplaceEntity: InsertOrReplaceEntity,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NumberFromString,
  redisClient: RedisClient
): express.RequestHandler {
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequestCitizenToFiscalCode(
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl,
      redisClient
    )
  );

  const handler = withAudit(insertOrReplaceEntity)(
    GetBPDAwardsHandler(citizenRepository),
    (context, { user, fiscalCode, citizenIdType }) => ({
      AuthLevel: isAdminAuthLevel(user, adb2cAdminGroup) ? "Admin" : "Support",
      Citizen: fiscalCode,
      Email: user.emails[0],
      OperationName: "GetBPDAwards",
      PartitionKey: user.oid,
      QueryParamType: citizenIdType,
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
