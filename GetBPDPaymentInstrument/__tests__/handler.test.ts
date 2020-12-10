import { taskEither } from "fp-ts/lib/TaskEither";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
import { FiscalCode } from "../../generated/definitions/FiscalCode";
import { PaymentMethodDetails } from "../../generated/definitions/PaymentMethodDetails";
import { PaymentIntrument } from "../../models/payment_instrument";
import { RequestCitizenToAdUserAndFiscalCode } from "../../utils/middleware/citizen_id";
import { AdUser } from "../../utils/strategy/bearer_strategy";
import { getChannel } from "../../utils/conversion";
import { GetBPDPaymentInstrumentHandler } from "../handler";

const mockFind = jest.fn();
const mockPaymentInstrumentRepo = taskEither.of<
  Error,
  Repository<PaymentIntrument>
>(({
  find: mockFind
} as unknown) as Repository<PaymentIntrument>);

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const anHpan = "55ad015a3bf4f1b2b0b822cd15d6c15b0f00a089f86d081884c7d659a2feaa0c" as NonEmptyString;
const aTimestamp = new Date();
const aChannel = "32875";

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
describe("GetBPDPaymentInstrumentHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a success response if query success", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          channel: aChannel,
          channel_descr: getChannel(aChannel),
          enabled: true,
          enrollment: aTimestamp,
          fiscal_code: aFiscalCode,
          hpan: anHpan as string,
          status: "ACTIVE"
        },
        {
          cancellation: aTimestamp,
          channel: aChannel,
          enabled: true,
          enrollment: aTimestamp,
          fiscal_code: aFiscalCode,
          hpan: anHpan as string,
          status: "INACTIVE"
        }
        // tslint:disable-next-line: readonly-array
      ] as PaymentIntrument[];
    });
    const handler = GetBPDPaymentInstrumentHandler(mockPaymentInstrumentRepo);
    const response = await handler(context, anHpan, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<
      PaymentMethodDetails
    >).value;
    expect(responseValue).toEqual({
      activation_periods: expect.any(Array),
      channel: aChannel,
      channel_descr: getChannel(aChannel),
      enabled: true,
      fiscal_code: aFiscalCode,
      hpan: anHpan
    } as PaymentMethodDetails);
    expect(responseValue.activation_periods).toHaveLength(2);
  });

  it("should return a not found response if not exists cf/hpan matches", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDPaymentInstrumentHandler(mockPaymentInstrumentRepo);
    const response = await handler(context, anHpan, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDPaymentInstrumentHandler(mockPaymentInstrumentRepo);
    const response = await handler(context, anHpan, aUserAndFiscalCode);

    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a validation error if the response decode fail", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          enrollment: aTimestamp,
          fiscal_code: aFiscalCode,
          hpan: anHpan
        }
      ];
    });
    const handler = GetBPDPaymentInstrumentHandler(mockPaymentInstrumentRepo);
    const response = await handler(context, anHpan, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
