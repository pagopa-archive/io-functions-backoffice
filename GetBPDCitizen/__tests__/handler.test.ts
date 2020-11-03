/* tslint:disable: no-any */

import { none, some } from "fp-ts/lib/Option";
import { taskEither } from "fp-ts/lib/TaskEither";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
import { BPDCitizen } from "../../generated/definitions/BPDCitizen";
import { Citizen } from "../../models/citizen";
import { GetBPDCitizenHandler } from "../handler";

const mockFind = jest.fn();
const mockCitizenRepository = taskEither.of<Error, Repository<Citizen>>(({
  find: mockFind
} as unknown) as Repository<Citizen>);

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aTimestamp = new Date();

describe("GetBPDCitizenHandler", () => {
  it("should return a success response if the user was found on db", async () => {
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDCitizen>).value;
    expect(responseValue).toEqual({
      fiscal_code: aFiscalCode,
      payment_methods: expect.any(Array),
      timestamp_tc: aTimestamp.toISOString()
    } as BPDCitizen);
    expect(responseValue.payment_methods).toHaveLength(2);
  });

  it("should return a not found response if the user is missing in db", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a validation error if the fiscal code is missing", async () => {
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, none);

    expect(response.kind).toBe("IResponseErrorValidation");
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
