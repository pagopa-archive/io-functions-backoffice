import { TableService } from "azure-storage";
import { toError } from "fp-ts/lib/Either";
import { taskEither, taskify } from "fp-ts/lib/TaskEither";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import {
  IResponse,
  IResponseErrorInternal,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";
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
  taskify<Error, unknown>(cb =>
    tableService.insertOrReplaceEntity(tableName, entity, cb)
  )();

/**
 * Augment an http handler to trace its execution
 * @param insertOrReplaceEntity
 * @param httpHandler a function representing an http handler
 * @param composeAuditLog a function that takes the very same arguments of the http handler and returns an audit log record
 *
 * @return a function with the same signature of httpHandler (plus an IResponseErrorInternal error)
 */
export const withAudit = (insertOrReplaceEntity: InsertOrReplaceEntity) => <
  TT,
  TR,
  T extends ReadonlyArray<TT>,
  R extends IResponse<TR>
>(
  httpHandler: (...args: T) => Promise<R>,
  composeAuditLog: (...p: T) => AuditLogTableRow
): ((...args: T) => Promise<R | IResponseErrorInternal>) => {
  return (...args: T) => {
    return taskEither
      .of<Error, AuditLogTableRow>(composeAuditLog(...args))
      .chain(insertOrReplaceEntity)
      .chain(_ => tryCatch(() => httpHandler(...args), toError))
      .fold<R | IResponseErrorInternal>(
        l => (l instanceof Error ? ResponseErrorInternal(l.message) : l),
        t.identity
      )
      .run();
  };
};
