// tslint:disable: member-access variable-name

import { FiscalCode } from "italia-ts-commons/lib/strings";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("transaction")
export class Transaction {
  @ViewColumn()
  fiscal_code: FiscalCode;

  @ViewColumn()
  hpan: string;

  @ViewColumn()
  trx_timestamp: Date;

  @ViewColumn()
  acquirer_id?: string;

  @ViewColumn()
  acquirer_descr: string;

  @ViewColumn()
  id_trx_acquirer: string;

  @ViewColumn()
  id_trx_issuer?: string;

  @ViewColumn()
  operation_type_id?: string;

  @ViewColumn()
  operation_type_descr?: string;

  @ViewColumn()
  amount?: number;

  @ViewColumn()
  amount_currency?: string;

  @ViewColumn()
  mcc?: string;

  @ViewColumn()
  mcc_descr?: string;

  @ViewColumn()
  score?: number;

  @ViewColumn()
  award_period_id?: number;

  @ViewColumn()
  insert_date?: Date;

  @ViewColumn()
  insert_user?: string;

  @ViewColumn()
  update_date?: Date;

  @ViewColumn()
  update_user?: string;

  @ViewColumn()
  merchant_id?: string;

  @ViewColumn()
  merchant_descr?: string;

  @ViewColumn()
  correlation_id?: string;

  @ViewColumn()
  correlation_desr?: string;

  @ViewColumn()
  bin?: string;

  @ViewColumn()
  terminal_id?: string;

  @ViewColumn()
  terminal_descr?: string;

  @ViewColumn()
  enabled?: boolean;

  @AfterLoad()
  // Convert all null values to undefined
  protected removeNullValues(): void {
    const keys = Object.keys(this) as ReadonlyArray<keyof this>;
    keys.forEach(key => {
      if (this[key] === null) {
        Object.assign(this, {
          [key]: undefined
        });
      }
    });
    // Type conversion for numeric columns. They come from database as string
    // and must be converted to float.
    if (this.amount !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.amount = parseFloat(String(this.amount));
    }
    if (this.award_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_id = parseFloat(String(this.award_period_id));
    }
    if (this.score !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.score = parseFloat(String(this.score));
    }
  }
}
