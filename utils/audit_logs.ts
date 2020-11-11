import { TableService } from "azure-storage";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";

const AuditLogTableRowR = t.interface({
  AuthLevel: t.union([t.literal("Admin"), t.literal("Support")]),
  OperationName: t.union([
    t.literal("GetBPDCitizen"),
    t.literal("GetBPDTransactions")
  ]),
  PartitionKey: NonEmptyString,
  RowKey: NonEmptyString
});

const AuditLogTableRowO = t.partial({
  Citizen: FiscalCode
});

const AuditLogTableRow = t.intersection([AuditLogTableRowO, AuditLogTableRowR]);

export type AuditLogTableRow = t.TypeOf<typeof AuditLogTableRow>;

export type InsertOrReplaceEntity = (
  entity: AuditLogTableRow
) => TaskEither<Error, unknown>;

export const GetInsertOrReplaceEntity = (
  tableService: TableService,
  tableName: NonEmptyString
): InsertOrReplaceEntity => (entity: AuditLogTableRow) =>
  tryCatch<Error, unknown>(
    () =>
      new Promise((resolve, reject) =>
        tableService.insertOrReplaceEntity(tableName, entity, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        })
      ),
    err => err as Error
  );
