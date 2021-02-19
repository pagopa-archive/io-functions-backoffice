import { Context } from "@azure/functions";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { TypeofApiCall } from "@pagopa/ts-commons/lib/requests";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import { identity } from "fp-ts/lib/function";
import { taskEither } from "fp-ts/lib/TaskEither";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import { GetWalletV2T } from "../generated/api/requestTypes";
import {
  PublicCreditCard,
  TypeEnum
} from "../generated/definitions/PublicCreditCard";
import { Wallet } from "../generated/definitions/Wallet";
import { isAdminAuthLevel } from "../utils/ad_user";
import { IServicePrincipalCreds } from "../utils/adb2c";
import { InsertOrReplaceEntity, withAudit } from "../utils/audit_logs";
import {
  RequestCitizenToAdUserAndFiscalCode,
  RequestCitizenToFiscalCode
} from "../utils/middleware/citizen_id";

type ErrorTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorInternal
  | IResponseErrorValidation;

type IHttpHandler = (
  context: Context,
  userAndCitizenId: RequestCitizenToAdUserAndFiscalCode
) => Promise<IResponseSuccessJson<Wallet> | ErrorTypes>;

export function GetPMWalletHandler(
  _: TypeofApiCall<GetWalletV2T>
): IHttpHandler {
  return async (context, __) => {
    // TODO: Missing implementation, the method is mocked.
    const mockWallet1: PublicCreditCard = {
      brand: "VISA",
      expireMonth: "1",
      expireYear: "2023",
      holder: "Mario Bianchi",
      hpan: "807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966",
      masked_pan: "4763",
      type: TypeEnum.Card
    };
    const mockWallet2: PublicCreditCard = {
      brand: "MASTERCARD",
      expireMonth: "7",
      expireYear: "2027",
      holder: "Mario Bianchi",
      hpan: "7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29",
      masked_pan: "7778",
      type: TypeEnum.Bancomat
    };
    return taskEither
      .of(ResponseSuccessJson([mockWallet1, mockWallet2]))
      .fold<IResponseSuccessJson<Wallet> | ErrorTypes>(err => {
        context.log.error(
          `GetPMWalletHandler|ERROR|Error retrieving the user wallet [${err}]`
        );
        return ResponseErrorInternal("Internal server error");
      }, identity)
      .run();
  };
}

export function GetPMWallet(
  getWalletV2: TypeofApiCall<GetWalletV2T>,
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
    GetPMWalletHandler(getWalletV2),
    (context, { user, fiscalCode, citizenIdType }) => ({
      AuthLevel: isAdminAuthLevel(user, adb2cAdminGroup) ? "Admin" : "Support",
      Citizen: fiscalCode,
      Email: user.emails[0],
      OperationName: "GetPMWallet",
      PartitionKey: user.oid,
      QueryParamType: citizenIdType,
      RowKey: context.executionContext.invocationId as string & NonEmptyString
    })
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
