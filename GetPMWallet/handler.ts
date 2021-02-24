import { Context } from "@azure/functions";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  TypeofApiCall,
  TypeofApiResponse
} from "@pagopa/ts-commons/lib/requests";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import {
  Either,
  fromNullable as eitherFromNullable,
  toError
} from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromNullable } from "fp-ts/lib/Option";
import {
  fromEither,
  fromLeft,
  fromPredicate,
  tryCatch
} from "fp-ts/lib/TaskEither";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import {
  GetWalletV2ResponsesT,
  GetWalletV2T
} from "../generated/api/requestTypes";
import { WalletBpayInfoInput } from "../generated/api/WalletBpayInfoInput";
import { WalletCardInfoInput } from "../generated/api/WalletCardInfoInput";
import { WalletSatispayInfoInput } from "../generated/api/WalletSatispayInfoInput";
import { WalletTypeEnum } from "../generated/api/WalletV2";
import { WalletV2ListResponse } from "../generated/api/WalletV2ListResponse";
import {
  PublicBPay,
  TypeEnum as BPayTypeEnum
} from "../generated/definitions/PublicBPay";
import {
  PublicCreditCard,
  TypeEnum as CardTypeEnum
} from "../generated/definitions/PublicCreditCard";
import {
  PublicSatispay,
  TypeEnum
} from "../generated/definitions/PublicSatispay";
import { PublicWalletItem } from "../generated/definitions/PublicWalletItem";
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

const InternalServerErrorResponse = ResponseErrorInternal(
  "Internal server error"
);

export const toApiPMWalletList = (
  _: WalletV2ListResponse
): Either<t.Errors, Wallet> => {
  return Wallet.decode({
    data: fromNullable(_.data)
      .map(walletList =>
        walletList.reduce((acc, wallet) => {
          const info = wallet.info;
          if (
            wallet.walletType === WalletTypeEnum.Card &&
            WalletCardInfoInput.is(info)
          ) {
            return [
              ...acc,
              {
                brand: info.brand,
                expireMonth: info.expireMonth,
                expireYear: info.expireYear,
                holder: info.holder,
                hpan: info.hashPan,
                masked_pan: info.blurredNumber,
                type: CardTypeEnum.Card
              } as PublicCreditCard
            ];
          }
          if (
            wallet.walletType === WalletTypeEnum.Bancomat &&
            WalletCardInfoInput.is(info)
          ) {
            return [
              ...acc,
              {
                brand: info.brand,
                expireMonth: info.expireMonth,
                expireYear: info.expireYear,
                holder: info.holder,
                hpan: info.hashPan,
                masked_pan: info.blurredNumber,
                type: CardTypeEnum.Bancomat
              } as PublicCreditCard
            ];
          }
          if (
            wallet.walletType === WalletTypeEnum.BPay &&
            WalletBpayInfoInput.is(info)
          ) {
            return [
              ...acc,
              {
                bank_name: info.bankName,
                hpan: info.uidHash,
                type: BPayTypeEnum.BPay
              } as PublicBPay
            ];
          }
          if (
            wallet.walletType === WalletTypeEnum.Satispay &&
            WalletSatispayInfoInput.is(info)
          ) {
            return [
              ...acc,
              {
                hpan: info.uuid,
                type: TypeEnum.Satispay
              } as PublicSatispay
            ];
          }
          return acc;
        }, [] as ReadonlyArray<PublicWalletItem>)
      )
      .getOrElse([])
  });
};

export function GetPMWalletHandler(
  getWalletV2: TypeofApiCall<GetWalletV2T>,
  subscriptionKey: NonEmptyString
): IHttpHandler {
  return async (context, { fiscalCode }) => {
    return tryCatch(
      () =>
        getWalletV2({
          "Fiscal-Code": fiscalCode,
          SubscriptionKey: subscriptionKey
        }),
      toError
    )
      .foldTaskEither(
        _ => fromLeft<Error, TypeofApiResponse<GetWalletV2ResponsesT>>(_),
        _ =>
          fromEither(_).mapLeft(
            err => new Error(errorsToReadableMessages(err).join("|"))
          )
      )
      .mapLeft<ErrorTypes>(err => {
        context.log.error(
          `GetPMWalletHandler|ERROR|Error retrieving the user wallet [${err}]`
        );
        return InternalServerErrorResponse;
      })
      .chain(
        fromPredicate(
          _ => _.status === 200,
          _ => {
            if (_.status === 404) {
              return ResponseErrorNotFound(
                "Citizen not found",
                "Missing wallet for the provided fiscal-code"
              );
            }
            context.log.error(
              `GetPMWalletHandler|ERROR|Error retrieving the user wallet [status:${_.status}|value:${_.value}]`
            );
            return InternalServerErrorResponse;
          }
        )
      )
      .chain(_ =>
        fromEither(eitherFromNullable(InternalServerErrorResponse)(_.value))
      )
      .chain(_ =>
        fromEither(toApiPMWalletList(_)).mapLeft(err => {
          context.log.error(
            `GetPMWalletHandler|ERROR|Error decoding wallet remapped response [${errorsToReadableMessages(
              err
            ).join("/")}]`
          );
          return InternalServerErrorResponse;
        })
      )
      .fold<IResponseSuccessJson<Wallet> | ErrorTypes>(identity, _ =>
        ResponseSuccessJson(_)
      )
      .run();
  };
}

export function GetPMWallet(
  getWalletV2: TypeofApiCall<GetWalletV2T>,
  insertOrReplaceEntity: InsertOrReplaceEntity,
  publicRsaCertificate: NonEmptyString,
  adb2cCreds: IServicePrincipalCreds,
  adb2cAdminGroup: NonEmptyString,
  cacheTtl: NumberFromString,
  subscriptionKey: NonEmptyString
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
    GetPMWalletHandler(getWalletV2, subscriptionKey),
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
