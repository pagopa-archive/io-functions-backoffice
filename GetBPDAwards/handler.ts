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
                  aw_per_aw_period_end: award.aw_per_aw_period_end.toISOString(),
                  aw_per_aw_period_start: award.aw_per_aw_period_start.toISOString(),
                  aw_per_insert_date: award.aw_per_insert_date?.toISOString(),
                  aw_per_update_date: award.aw_per_update_date?.toISOString(),
                  aw_winn_aw_period_end: award.aw_winn_aw_period_end?.toISOString(),
                  aw_winn_aw_period_start: award.aw_winn_aw_period_start?.toISOString(),
                  aw_winn_insert_date: award.aw_winn_insert_date?.toISOString(),
                  aw_winn_update_date: award.aw_winn_update_date?.toISOString(),
                  cit_rank_insert_date: award.cit_rank_insert_date?.toISOString(),
                  cit_rank_update_date: award.cit_rank_update_date?.toISOString(),
                  ranking_date: award.ranking_date?.toISOString()
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
            aw_per_aw_period_end: award.aw_per_aw_period_end.toISOString(),
            aw_per_aw_period_start: award.aw_per_aw_period_start.toISOString(),
            aw_per_insert_date: award.aw_per_insert_date?.toISOString(),
            aw_per_update_date: award.aw_per_update_date?.toISOString(),
            aw_winn_aw_period_end: award.aw_winn_aw_period_end?.toISOString(),
            aw_winn_aw_period_start: award.aw_winn_aw_period_start?.toISOString(),
            aw_winn_insert_date: award.aw_winn_insert_date?.toISOString(),
            aw_winn_update_date: award.aw_winn_update_date?.toISOString(),
            cit_rank_insert_date: award.cit_rank_insert_date?.toISOString(),
            cit_rank_update_date: award.cit_rank_update_date?.toISOString(),
            ranking_date: award.ranking_date?.toISOString()
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
  cacheTtl: NumberFromString
): express.RequestHandler {
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequestCitizenToFiscalCode(
      publicRsaCertificate,
      adb2cCreds,
      adb2cAdminGroup,
      cacheTtl
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
