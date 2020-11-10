import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";

const AuditLogTableRowR = t.interface({
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
