// tslint:disable: member-access variable-name
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";

@ViewEntity("v_bpd_award_citizen")
export class Award {
  @ViewColumn({
    name: "fiscal_code_s"
  })
  fiscal_code: FiscalCode;

  @ViewColumn({
    name: "aw_winn_award_period_id_n"
  })
  aw_winn_award_period_id: number;

  @ViewColumn({
    name: "payoff_instr_s"
  })
  payoff_instr?: string;

  @ViewColumn({
    name: "amount_n"
  })
  amount?: number;

  @ViewColumn({
    name: "aw_winn_aw_period_start_d"
  })
  aw_winn_aw_period_start?: Date;

  @ViewColumn({
    name: "aw_winn_aw_period_end_d"
  })
  aw_winn_aw_period_end?: Date;

  @ViewColumn({
    name: "jackpot_n"
  })
  jackpot?: number;

  @ViewColumn({
    name: "aw_winn_cashback_n"
  })
  aw_winn_cashback?: number;

  @ViewColumn({
    name: "typology_s"
  })
  typology?: string;

  @ViewColumn({
    name: "account_holder_cf_s"
  })
  account_holder_cf?: string;

  @ViewColumn({
    name: "account_holder_name_s"
  })
  account_holder_name?: string;

  @ViewColumn({
    name: "account_holder_surname_s"
  })
  account_holder_surname?: string;

  @ViewColumn({
    name: "check_instr_status_s"
  })
  check_instr_status?: string;

  @ViewColumn({
    name: "account_holder_s"
  })
  account_holder?: string;

  @ViewColumn({
    name: "aw_winn_insert_date_t"
  })
  aw_winn_insert_date?: Date;

  @ViewColumn({
    name: "aw_winn_insert_user_s"
  })
  aw_winn_insert_user?: string;

  @ViewColumn({
    name: "aw_winn_update_date_t"
  })
  aw_winn_update_date?: Date;

  @ViewColumn({
    name: "aw_winn_update_user_s"
  })
  aw_winn_update_user?: string;

  @ViewColumn({
    name: "aw_winn_enabled_b"
  })
  aw_winn_enabled?: boolean;

  @ViewColumn({
    name: "cit_rank_award_period_id"
  })
  cit_rank_award_period_id?: number;

  @ViewColumn({
    name: "cit_rank_cashback_n"
  })
  cit_rank_cashback?: number;

  @ViewColumn({
    name: "transaction_n"
  })
  transaction?: number;

  @ViewColumn({
    name: "ranking_n"
  })
  ranking?: number;

  @ViewColumn({
    name: "ranking_date_t"
  })
  ranking_date?: Date;

  @ViewColumn({
    name: "cit_rank_insert_date_t"
  })
  cit_rank_insert_date?: Date;

  @ViewColumn({
    name: "cit_rank_insert_user_s"
  })
  cit_rank_insert_user?: string;

  @ViewColumn({
    name: "cit_rank_update_date_t"
  })
  cit_rank_update_date?: Date;

  @ViewColumn({
    name: "cit_rank_update_user_s"
  })
  cit_rank_update_user?: string;

  @ViewColumn({
    name: "cit_rank_enabled_b"
  })
  cit_rank_enabled?: boolean;

  @ViewColumn({
    name: "award_period_id_n"
  })
  award_period_id: number;

  @ViewColumn({
    name: "aw_per_aw_period_start_d"
  })
  aw_per_aw_period_start: Date;

  @ViewColumn({
    name: "aw_per_aw_period_end_d"
  })
  aw_per_aw_period_end: Date;

  @ViewColumn({
    name: "aw_grace_period_n"
  })
  aw_grace_period: number;

  @ViewColumn({
    name: "amount_max_n"
  })
  amount_max: number;

  @ViewColumn({
    name: "trx_volume_min_n"
  })
  trx_volume_min: number;

  @ViewColumn({
    name: "trx_eval_max_n"
  })
  trx_eval_max: number;

  @ViewColumn({
    name: "ranking_min_n"
  })
  ranking_min: number;

  @ViewColumn({
    name: "trx_cashback_max_n"
  })
  trx_cashback_max: number;

  @ViewColumn({
    name: "period_cashback_max_n"
  })
  period_cashback_max: number;

  @ViewColumn({
    name: "cashback_perc_n"
  })
  cashback_perc: number;

  @ViewColumn({
    name: "aw_per_insert_date_t"
  })
  aw_per_insert_date?: Date;

  @ViewColumn({
    name: "aw_per_insert_user_s"
  })
  aw_per_insert_user?: string;

  @ViewColumn({
    name: "aw_per_update_date_t"
  })
  aw_per_update_date?: Date;

  @ViewColumn({
    name: "aw_per_update_user_s"
  })
  aw_per_update_user?: string;

  @ViewColumn({
    name: "aw_per_enabled_b"
  })
  aw_per_enabled?: boolean;

  @AfterLoad()
  // Convert all null values to undefined
  // tslint:disable-next-line: cognitive-complexity
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
    if (this.aw_winn_award_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.aw_winn_award_period_id = parseFloat(
        String(this.aw_winn_award_period_id)
      );
    }
    if (this.jackpot !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.jackpot = parseFloat(String(this.jackpot));
    }

    if (this.aw_winn_cashback !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.aw_winn_cashback = parseFloat(String(this.aw_winn_cashback));
    }

    if (this.cit_rank_award_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.cit_rank_award_period_id = parseFloat(
        String(this.cit_rank_award_period_id)
      );
    }

    if (this.cit_rank_cashback !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.cit_rank_cashback = parseFloat(String(this.cit_rank_cashback));
    }

    if (this.transaction !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.transaction = parseFloat(String(this.transaction));
    }

    if (this.ranking !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.ranking = parseFloat(String(this.ranking));
    }

    if (this.award_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_id = parseFloat(String(this.award_period_id));
    }

    if (this.aw_grace_period !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.aw_grace_period = parseFloat(String(this.aw_grace_period));
    }

    if (this.amount_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.amount_max = parseFloat(String(this.amount_max));
    }

    if (this.trx_volume_min !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.trx_volume_min = parseFloat(String(this.trx_volume_min));
    }

    if (this.trx_eval_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.trx_eval_max = parseFloat(String(this.trx_eval_max));
    }

    if (this.ranking_min !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.ranking_min = parseFloat(String(this.ranking_min));
    }

    if (this.trx_cashback_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.trx_cashback_max = parseFloat(String(this.trx_cashback_max));
    }

    if (this.period_cashback_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.period_cashback_max = parseFloat(String(this.period_cashback_max));
    }

    if (this.cashback_perc !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.cashback_perc = parseFloat(String(this.cashback_perc));
    }
  }
}
