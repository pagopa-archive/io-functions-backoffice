import { fromLeft, taskEither } from "fp-ts/lib/TaskEither";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { AuditLogTableRow, withAudit } from "../audit_logs";

const param1 = "1" as NonEmptyString;
const param2 = "AAABBB01C02D345E" as FiscalCode;

const mockInsertOrReplaceEntity = jest
  .fn()
  .mockImplementation(() => taskEither.of(void 0));
const mockHttpHandler = jest
  .fn()
  .mockImplementation(() => Promise.resolve(ResponseSuccessJson({}))) as (
  p1: typeof param1,
  p2: typeof param2
) => Promise<IResponseSuccessJson<unknown>>;
const aFiscalCode = "AAABBB01C02D345E" as FiscalCode;
const anAuditLog: AuditLogTableRow = {
  AuthLevel: "Admin",
  Citizen: aFiscalCode,
  OperationName: "GetBPDCitizen",
  PartitionKey: "aPartitionKey" as NonEmptyString,
  QueryParamType: "FiscalCode",
  RowKey: "aRowKey" as NonEmptyString
};

describe("withAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the function handler with the same params if insertOrReplaceEntity success", async () => {
    await withAudit(mockInsertOrReplaceEntity)(
      mockHttpHandler,
      () => anAuditLog
    )(param1, param2);
    expect(mockInsertOrReplaceEntity).toHaveBeenNthCalledWith(1, anAuditLog);
    expect(mockHttpHandler).toHaveBeenNthCalledWith(1, param1, param2);
  });

  it("should return a ResponseErrorInternal if insertOrReplaceEntity fail", async () => {
    const expectedError = new Error("Error logging the action");
    mockInsertOrReplaceEntity.mockImplementationOnce(() =>
      fromLeft(expectedError)
    );
    const response = await withAudit(mockInsertOrReplaceEntity)(
      mockHttpHandler,
      () => anAuditLog
    )(param1, param2);
    expect(mockInsertOrReplaceEntity).toHaveBeenNthCalledWith(1, anAuditLog);
    expect(mockHttpHandler).toBeCalledTimes(0);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: `Internal server error: ${expectedError.message}`,
      kind: "IResponseErrorInternal"
    });
  });
});
