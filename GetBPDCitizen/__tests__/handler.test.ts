/* tslint:disable: no-any */

import { some } from "fp-ts/lib/Option";
import { taskEither } from "fp-ts/lib/TaskEither";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
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
          timestamp_tc: aTimestamp
        } as Citizen
      ];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return a not found response if the user is missing in db", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, some(aFiscalCode));

    expect(response.kind).toBe("IResponseErrorNotFound");
  });
});
