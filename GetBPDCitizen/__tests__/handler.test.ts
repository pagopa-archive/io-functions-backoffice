/* tslint:disable: no-any */

import { taskEither } from "fp-ts/lib/TaskEither";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
import { BPDCitizen } from "../../generated/definitions/BPDCitizen";
import { PaymentMethodStatusEnum } from "../../generated/definitions/PaymentMethodStatus";
import { Citizen } from "../../models/citizen";
import { PaymentIntrument } from "../../models/payment_instrument";
import { AdUser } from "../../utils/strategy/bearer_strategy";
import { GetBPDCitizenHandler } from "../handler";

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aTimestamp = new Date();

const mockFindCitizen = jest.fn().mockImplementation(async () => {
  return [
    {
      fiscal_code: aFiscalCode,
      payment_instrument_hpan:
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      payment_instrument_insert_date: aTimestamp,
      payment_instrument_insert_user: "An user",
      payment_instrument_status: "ACTIVE",
      payment_instrument_update_date: aTimestamp,
      payment_instrument_update_user: "An user",
      timestamp_tc: aTimestamp
    },
    {
      fiscal_code: aFiscalCode,
      payment_instrument_hpan:
        "55ad015a3bf4f1b2b0b822cd15d6c15b0f00a089f86d081884c7d659a2feaa0c",
      payment_instrument_status: "INACTIVE",
      timestamp_tc: aTimestamp
    }
    // tslint:disable-next-line: readonly-array
  ] as Citizen[];
});
const mockFindPaymentInstrument = jest.fn().mockImplementation(async () => {
  return [];
});
const mockCitizenRepository = taskEither.of<Error, Repository<Citizen>>(({
  find: mockFindCitizen
} as unknown) as Repository<Citizen>);
const mockPaymentInstrumentRepository = taskEither.of<
  Error,
  Repository<PaymentIntrument>
>(({
  find: mockFindPaymentInstrument
} as unknown) as Repository<PaymentIntrument>);

const anAuthenticatedUser: AdUser = {
  emails: ["email@example.com" as EmailString],
  family_name: "Surname",
  given_name: "Name",
  oid: "anUserOID" as NonEmptyString
};

describe("GetBPDCitizenHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a success response if the user was found on db", async () => {
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });
    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDCitizen>).value;
    expect(responseValue).toEqual({
      fiscal_code: aFiscalCode,
      payment_methods: expect.any(Array),
      timestamp_tc: aTimestamp.toISOString()
    } as BPDCitizen);
    expect(responseValue.payment_methods).toHaveLength(2);
  });

  it("should merge other payment methods from v_bpd_payment_instrument view", async () => {
    mockFindPaymentInstrument.mockImplementationOnce(async () => {
      return ([
        {
          enabled: true,
          enrollment: aTimestamp,
          fiscal_code: aFiscalCode,
          hpan:
            "6c15b0f00a089f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d",
          status: PaymentMethodStatusEnum.ACTIVE
        }
      ] as unknown) as ReadonlyArray<PaymentIntrument>;
    });
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });
    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDCitizen>).value;
    expect(responseValue).toEqual({
      fiscal_code: aFiscalCode,
      payment_methods: expect.any(Array),
      timestamp_tc: aTimestamp.toISOString()
    } as BPDCitizen);
    expect(responseValue.payment_methods).toHaveLength(3);
  });

  it("should return a not found response if the user is missing in db", async () => {
    mockFindCitizen.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFindCitizen.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });
    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an error the find payment instrument query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFindPaymentInstrument.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });
    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a validation error if the response decode fail", async () => {
    mockFindCitizen.mockImplementationOnce(async () => {
      return [
        {
          fiscal_code: "WRONG FISCAL CODE" as FiscalCode,
          timestamp_tc: aTimestamp
        } as Citizen
      ];
    });
    const handler = GetBPDCitizenHandler(
      mockCitizenRepository,
      mockPaymentInstrumentRepository
    );
    const response = await handler(context, {
      citizenIdType: "FiscalCode",
      fiscalCode: aFiscalCode,
      user: anAuthenticatedUser
    });
    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
