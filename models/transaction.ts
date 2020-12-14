// tslint:disable: member-access variable-name

import { FiscalCode } from "italia-ts-commons/lib/strings";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("v_bpd_winning_transaction")
export class Transaction {
  @ViewColumn({
    name: "fiscal_code_s"
  })
  fiscal_code: FiscalCode;

  @ViewColumn({
    name: "hpan_s"
  })
  hpan: string;

  @ViewColumn({
    name: "trx_timestamp_t"
  })
  trx_timestamp: Date;

  @ViewColumn({
    name: "acquirer_id_s"
  })
  acquirer_id?: string;

  @ViewColumn({
    name: "acquirer_c"
  })
  acquirer: string; // TODO: It's an enum type

  @ViewColumn({
    name: "id_trx_acquirer_s"
  })
  id_trx_acquirer: string;

  @ViewColumn({
    name: "id_trx_issuer_s"
  })
  id_trx_issuer?: string;

  @ViewColumn({
    name: "operation_type_c"
  })
  operation_type?: string; // TODO: It's an enum type

  @ViewColumn({
    name: "circuit_type_c"
  })
  circuit_type: string; // TODO: It's an enum type

  @ViewColumn({
    name: "amount_i"
  })
  amount?: number;

  @ViewColumn({
    name: "amount_currency_c"
  })
  amount_currency?: string; // TODO: fixed to 978 = EUR

  @ViewColumn({
    name: "score_n"
  })
  score?: number;

  @ViewColumn({
    name: "award_period_id_n"
  })
  award_period_id?: number;

  @ViewColumn({
    name: "winn_trans_insert_date_t"
  })
  insert_date?: Date;

  @ViewColumn({
    name: "winn_trans_insert_user_s"
  })
  insert_user?: string;

  @ViewColumn({
    name: "winn_trans_update_date_t"
  })
  update_date?: Date;

  @ViewColumn({
    name: "winn_trans_update_user_s"
  })
  update_user?: string;

  @ViewColumn({
    name: "merchant_id_s"
  })
  merchant_id?: string;

  @ViewColumn({
    name: "correlation_id_s"
  })
  correlation_id?: string;

  @ViewColumn({
    name: "bin_s"
  })
  bin?: string;

  @ViewColumn({
    name: "terminal_id_s"
  })
  terminal_id?: string;

  @ViewColumn({
    name: "enabled_b"
  })
  enabled?: boolean;

  @ViewColumn({
    name: "elab_ranking_b"
  })
  elab_ranking?: boolean;

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
