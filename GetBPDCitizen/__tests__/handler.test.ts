/* tslint:disable: no-any */

import { taskEither } from "fp-ts/lib/TaskEither";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
import { BPDCitizen } from "../../generated/definitions/BPDCitizen";
import { CitizenID } from "../../generated/definitions/CitizenID";
import { SupportToken } from "../../generated/definitions/SupportToken";
import { Citizen } from "../../models/citizen";
import { GetBPDCitizenHandler } from "../handler";

const mockFind = jest.fn();
const mockCitizenRepository = taskEither.of<Error, Repository<Citizen>>(({
  find: mockFind
} as unknown) as Repository<Citizen>);

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aTimestamp = new Date();
const aPublicRsaCert = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCc3FR1mjQDrhvaDF8UpdtQQknh
MAyxT1o6eCwWIiF+ZHsnnnn8XI++V11+uqSlRlh9gamt4XKqc8/4vKTKzxBYJPV/
TuJDDBC1kbs6SGpqbMjnHk4hUXeSlxbvuksmnwEzmT7u9jYlCj5Zjmr+pBLKBoTk
FmprTzaax++spskX3QIDAQAB
-----END PUBLIC KEY-----` as NonEmptyString;

const aSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTM2ODYwMywiZXhwIjoxNjA1OTczNDAzLCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTNQU1MxUVZXTTdRQjNERldNM0YxRkIifQ.BNr5rQRXiC9U0ZLM_RfGX7ad9467OQ5bzMC8DFp-vb5O4seVzJMu1ejRl2kHoqw8Wa2sepMZj30wpDwW4g3QDDj7pqqsjxNt1ikrNET6avWsaOy2n7b-w__gl37IE_519k9FPDTJQW3I3wPo8AhW4iibDMAU-iBzGNo7sFRBHeg` as SupportToken;
const anInvalidSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTM2ODYwMywiZXhwIjoxNjA1OTczNDAzLCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTNQU1MxUVZXTTdRQjNERldNM0YxRkIifQ.BNr5rQRXiC9U0ZLM_RfGX7ad9467OQ5bzMC8DFp-vb5O4seVzJMu1ejRl2kHoqw8Wa2sepMZj30wpDwW4g3QDDj7pqqsjxNt1ikrNET6avWsaOy2n7b-w__gl37IE_529k9FPATJQW3I3wPo8AhW4iibDMAU-iBzGNo7sFRBHeg` as SupportToken;

const aSuccessCase = (citizenId: CitizenID) =>
  jest.fn(async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          fiscal_code: aFiscalCode,
          payment_instrument_hpan:
            "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
          payment_instrument_status: "ACTIVE",
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, citizenId);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDCitizen>).value;
    expect(responseValue).toEqual({
      fiscal_code: aFiscalCode,
      payment_methods: expect.any(Array),
      timestamp_tc: aTimestamp.toISOString()
    } as BPDCitizen);
    expect(responseValue.payment_methods).toHaveLength(2);
  });
describe("GetBPDCitizenHandler", () => {
  it("should return a success response if the user was found on db", async () => {
    aSuccessCase(aFiscalCode);
  });

  it("should return a success response if the user was found on db and a correct support token is provided", async () => {
    aSuccessCase(aSupportToken);
  });

  it("should return a not found response if the user is missing in db", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, aFiscalCode);

    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a validation error if the response decode fail", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          fiscal_code: "WRONG FISCAL CODE" as FiscalCode,
          timestamp_tc: aTimestamp
        } as Citizen
      ];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorValidation");
  });

  it("should return a forbidden error if the support token is invalid", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          fiscal_code: aFiscalCode,
          timestamp_tc: aTimestamp
        } as Citizen
      ];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, anInvalidSupportToken);

    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });
});
