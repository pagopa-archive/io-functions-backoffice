/* tslint:disable: no-any */

import { none, some } from "fp-ts/lib/Option";
import { taskEither } from "fp-ts/lib/TaskEither";
import { IResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { Repository } from "typeorm";
import { context } from "../../__mocks__/durable-functions";
import { BPDTransactionList } from "../../generated/definitions/BPDTransactionList";
import { Transaction } from "../../models/transaction";
import { GetBPDTransactionsHandler } from "../handler";

const mockFind = jest.fn();
const mockTransactionRepository = taskEither.of<Error, Repository<Transaction>>(
  ({
    find: mockFind
  } as unknown) as Repository<Transaction>
);

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aPublicRsaCert = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCc3FR1mjQDrhvaDF8UpdtQQknh
MAyxT1o6eCwWIiF+ZHsnnnn8XI++V11+uqSlRlh9gamt4XKqc8/4vKTKzxBYJPV/
TuJDDBC1kbs6SGpqbMjnHk4hUXeSlxbvuksmnwEzmT7u9jYlCj5Zjmr+pBLKBoTk
FmprTzaax++spskX3QIDAQAB
-----END PUBLIC KEY-----` as NonEmptyString;
const anAcquirer = "Acquirer1";
const aTimestamp = new Date();

describe("GetBPDTransactionsHandler", () => {
  it("should return a success response if query success", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          acquirer_descr: anAcquirer,
          fiscal_code: aFiscalCode,
          hpan:
            "55ad015a3bf4f1b2b0b822cd15d6c15b0f00a089f86d081884c7d659a2feaa0c",
          id_trx_acquirer: "123456789012",
          trx_timestamp: aTimestamp
        },
        {
          acquirer_descr: anAcquirer,
          fiscal_code: aFiscalCode,
          hpan:
            "0b822cd15d6c15b0f00a089f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b",
          id_trx_acquirer: "123456789013",
          trx_timestamp: aTimestamp
        }
        // tslint:disable-next-line: readonly-array
      ] as Transaction[];
    });
    const handler = GetBPDTransactionsHandler(
      mockTransactionRepository,
      aPublicRsaCert
    );
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDTransactionList>)
      .value;
    expect(responseValue).toEqual({
      transactions: expect.any(Array)
    } as BPDTransactionList);
    expect(responseValue.transactions).toHaveLength(2);
  });

  it("should return a success reponse with empty transactions for user with no one transaction", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [];
    });
    const handler = GetBPDTransactionsHandler(
      mockTransactionRepository,
      aPublicRsaCert
    );
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    const responseValue = (response as IResponseSuccessJson<BPDTransactionList>)
      .value;
    expect(responseValue).toEqual({
      transactions: expect.any(Array)
    } as BPDTransactionList);
    expect(responseValue.transactions).toHaveLength(0);
  });

  it("should return an error the find query fail", async () => {
    const expectedError = new Error("Query Error");
    mockFind.mockImplementationOnce(() => {
      return Promise.reject(expectedError);
    });
    const handler = GetBPDTransactionsHandler(
      mockTransactionRepository,
      aPublicRsaCert
    );
    const response = await handler(context, aFiscalCode);

    expect(context.log.error).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a validation error if the response decode fail", async () => {
    mockFind.mockImplementationOnce(async () => {
      return [
        {
          acquirer_descr: anAcquirer,
          fiscal_code: aFiscalCode,
          id_trx_acquirer: "123456789012",
          trx_timestamp: aTimestamp
        }
      ];
    });
    const handler = GetBPDTransactionsHandler(
      mockTransactionRepository,
      aPublicRsaCert
    );
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorValidation");
  });
});
