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
import { CitizenID } from "../../generated/definitions/CitizenID";
import { SupportToken } from "../../generated/definitions/SupportToken";
import { Citizen } from "../../models/citizen";
import { AdUser } from "../../utils/strategy/bearer_strategy";
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

const aSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTU0NzU3NywiZXhwIjo4NTE3NTQ3NTc3LCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTkxRk1NMTg4WUJNQks3WEZCRzdZQUoifQ.jvj2JEtxHhyFZJbzdeFfymyEEOhD4FPBm2wjNwStWMFqbD8B8CuKEAN_fl6tBrASdI0ZW2XfQujP_TejMFiAjvf696FZKUIyIJo58iOb0nfyRwTCCWUYuyFgkvVMnuMSo47rzp7LUSYx8VUaqz5pJLK3p8w9C6Q-yxrvxGJOZ6M` as SupportToken;
const anInvalidSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTU0NzYzOCwiZXhwIjoxNjA1NTQ3NjM5LCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTkxSEZaTUdGWkdFODUzTlg0TjIwTjYifQ.ENAJhnQB19jUKDYXyvf9LIps9tsRMGUIhsYKyBx8KQbhytKBzRBYaCskuvkHQbEE-CdK2kD66RoQIeg3-ulgA6uFe1aPrsAVS9sbxHKaz_xgHbB6MmyPiRYF9vuv-HsiVHLcL-XNOtczDmGdAsBz-uugeMkk2BjXqR2hf7hgP5Y` as SupportToken;
const anotherInvalidSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDIiwiaWF0IjoxNjA1NTQ3NDYwLCJleHAiOjg1MTc1NDc0NjAsImlzcyI6ImlvLWJhY2tlbmQiLCJqdGkiOiIwMUVROTFDMVZGUUZSSlIwSzJBMEI4Q1o2UyJ9.j0OD1IDJFOqj3Hhh0t6m97RIS5Jgg7gMEWI35JIgxaUcPYwg77lp08njjdyDe88xkTpaMyXRN08EVvVdgcQTgGUrP2EV4SpSkFKWxQbNzdZqNEpRghTCjgxgQARml8CyU6pMn-c_baXKJsiEyWq5TpCGUAbhUQZVkV3liywTSr8` as SupportToken;

const anAuthenticatedUser: AdUser = {
  emails: ["email@example.com" as EmailString],
  family_name: "Surname",
  given_name: "Name",
  oid: "anUserOID" as NonEmptyString
};

const aSuccessCase = (citizenId: CitizenID) =>
  jest.fn(async () => {
    mockFind.mockImplementationOnce(async () => {
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, anAuthenticatedUser, citizenId);

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
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);

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
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);

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
    const response = await handler(
      context,
      anAuthenticatedUser,
      anInvalidSupportToken
    );

    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return a validation error if the support token contains an invalid FiscalCode", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository, aPublicRsaCert);
    const response = await handler(
      context,
      anAuthenticatedUser,
      anotherInvalidSupportToken
    );

    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
