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
import {
  AuditLogTableRow,
  InsertOrReplaceEntity
} from "../../utils/audit_logs";
import { AdUser } from "../../utils/strategy/bearer_strategy";
import { GetBPDCitizenHandler } from "../handler";

const mockFind = jest.fn();
const mockCitizenRepository = taskEither.of<Error, Repository<Citizen>>(({
  find: mockFind
} as unknown) as Repository<Citizen>);

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aTimestamp = new Date();

const anAuthenticatedUser: AdUser = {
  emails: ["email@example.com" as EmailString],
  family_name: "Surname",
  given_name: "Name",
  oid: "anUserOID" as NonEmptyString
};

const expectedAdminAuditLog: AuditLogTableRow = {
  AuthLevel: "Admin",
  Citizen: aFiscalCode,
  OperationName: "GetBPDCitizen",
  PartitionKey: anAuthenticatedUser.oid,
  RowKey: expect.any(String)
};
describe("GetBPDCitizenHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a success response if the user was found on db", async () => {
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);
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
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
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
    const handler = GetBPDCitizenHandler(mockCitizenRepository);
    const response = await handler(context, anAuthenticatedUser, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
