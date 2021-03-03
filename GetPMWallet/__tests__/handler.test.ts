/* tslint:disable: no-any */

import * as t from "io-ts";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "italia-ts-commons/lib/strings";
import { context } from "../../__mocks__/durable-functions";
import { WalletBpayInfoInput } from "../../generated/api/WalletBpayInfoInput";
import {
  TypeEnum,
  WalletCardInfoInput
} from "../../generated/api/WalletCardInfoInput";
import { WalletSatispayInfoInput } from "../../generated/api/WalletSatispayInfoInput";
import { WalletTypeEnum, WalletV2 } from "../../generated/api/WalletV2";
import { Wallet } from "../../generated/definitions/Wallet";
import { RequestCitizenToAdUserAndFiscalCode } from "../../utils/middleware/citizen_id";
import { AdUser } from "../../utils/strategy/bearer_strategy";
import { GetPMWalletHandler } from "../handler";

const aCreditCard: WalletCardInfoInput = {
  blurredNumber: "1234",
  brand: "VISA",
  brandLogo: "logo",
  expireMonth: "1",
  expireYear: "2021",
  hashPan: "hash_pan",
  holder: "Mario Rossi",
  htokenList: ["token1", "token2"],
  issuerAbiCode: "30012",
  type: TypeEnum.CRD
};

const aBacomat: WalletCardInfoInput = {
  blurredNumber: "1234",
  brandLogo: "logo",
  expireMonth: "1",
  expireYear: "2021",
  hashPan: "hash_pan",
  htokenList: ["token1", "token2"],
  issuerAbiCode: "30012",
  type: TypeEnum.DEB
};

const aBPay: WalletBpayInfoInput = {
  bankName: "Bank",
  brandLogo: "logo",
  instituteCode: "30012",
  numberObfuscated: "1234",
  paymentInstruments: [{ defaultReceive: true, defaultSend: true }],
  uidHash: "hash_pan"
};

const aSatispay: WalletSatispayInfoInput = {
  brandLogo: "logo",
  uuid: "hash_pan"
};

const mockGetWalletV2 = jest.fn().mockImplementation(async _ =>
  t.success({
    status: 200,
    value: {
      data: [
        {
          idWallet: 1,
          info: aCreditCard,
          walletType: WalletTypeEnum.Card
        },
        {
          idWallet: 2,
          info: aBacomat,
          walletType: WalletTypeEnum.Bancomat
        },
        {
          idWallet: 3,
          info: aBPay,
          walletType: WalletTypeEnum.BPay
        },
        {
          idWallet: 4,
          info: aSatispay,
          walletType: WalletTypeEnum.Satispay
        }
      ] as ReadonlyArray<WalletV2>
    }
  })
);

const getWalletApiClient = {
  getWalletV2: mockGetWalletV2
};

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;

const anAuthenticatedUser: AdUser = {
  emails: ["email@example.com" as EmailString],
  family_name: "Surname",
  given_name: "Name",
  oid: "anUserOID" as NonEmptyString
};

const aUserAndFiscalCode: RequestCitizenToAdUserAndFiscalCode = {
  citizenIdType: "FiscalCode",
  fiscalCode: aFiscalCode,
  user: anAuthenticatedUser
};

describe("GetPMWalletHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a success response if PM API succeded", async () => {
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<Wallet>).value;
    expect(responseValue).toEqual({
      data: expect.any(Array)
    } as Wallet);
    expect(responseValue.data).toHaveLength(4);
  });

  it("should return a success reponse with empty data for user with no one wallet", async () => {
    mockGetWalletV2.mockImplementationOnce(async () =>
      t.success({
        status: 200,
        value: {
          data: []
        }
      })
    );
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<Wallet>).value;
    expect(responseValue).toEqual({
      data: expect.any(Array)
    } as Wallet);
    expect(responseValue.data).toHaveLength(0);
  });

  it("should return a not found error if PM returns a status 404 response", async () => {
    mockGetWalletV2.mockImplementationOnce(async () =>
      t.success({
        status: 404
      })
    );
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);
    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error if the PM API call fails", async () => {
    mockGetWalletV2.mockImplementationOnce(async () =>
      t.success({
        status: 500
      })
    );
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);
    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an error if the PM client throw an error", async () => {
    mockGetWalletV2.mockImplementationOnce(async () => {
      throw new Error("Client error");
    });
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);
    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an error if the PM client return a validation error", async () => {
    mockGetWalletV2.mockImplementationOnce(
      async () => NonEmptyString.decode("") // Fake decoding error
    );
    const handler = GetPMWalletHandler(getWalletApiClient);
    const response = await handler(context, aUserAndFiscalCode);
    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });
});
