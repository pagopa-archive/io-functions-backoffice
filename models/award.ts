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
    name: "id_n"
  })
  award_winner_id: number;

  @ViewColumn({
    name: "payoff_instr_s"
  })
  award_winner_payoff_instr?: string;

  @ViewColumn({
    name: "amount_n"
  })
  award_winner_amount?: number;

  @ViewColumn({
    name: "aw_winn_aw_period_start_d"
  })
  award_winner_period_start?: Date;

  @ViewColumn({
    name: "aw_winn_aw_period_end_d"
  })
  award_winner_period_end?: Date;

  @ViewColumn({
    name: "jackpot_n"
  })
  award_winner_jackpot?: number;

  @ViewColumn({
    name: "aw_winn_cashback_n"
  })
  award_winner_cashback?: number;

  @ViewColumn({
    name: "typology_s"
  })
  award_winner_typology?: string;

  @ViewColumn({
    name: "account_holder_cf_s"
  })
  award_winner_account_holder_cf?: string;

  @ViewColumn({
    name: "account_holder_name_s"
  })
  award_winner_account_holder_name?: string;

  @ViewColumn({
    name: "account_holder_surname_s"
  })
  award_winner_account_holder_surname?: string;

  @ViewColumn({
    name: "check_instr_status_s"
  })
  award_winner_check_instr_status?: string;

  @ViewColumn({
    name: "account_holder_s"
  })
  award_winner_account_holder?: string;

  @ViewColumn({
    name: "aw_winn_insert_date_t"
  })
  award_winner_insert_date?: Date;

  @ViewColumn({
    name: "aw_winn_insert_user_s"
  })
  award_winner_insert_user?: string;

  @ViewColumn({
    name: "aw_winn_update_date_t"
  })
  award_winner_update_date?: Date;

  @ViewColumn({
    name: "aw_winn_update_user_s"
  })
  award_winner_update_user?: string;

  @ViewColumn({
    name: "aw_winn_enabled_b"
  })
  award_winner_enabled?: boolean;

  @ViewColumn({
    name: "cit_rank_award_period_id"
  })
  citizen_ranking_period_id?: number;

  @ViewColumn({
    name: "cit_rank_cashback_n"
  })
  citizen_ranking_cashback?: number;

  @ViewColumn({
    name: "transaction_n"
  })
  citizen_ranking_transaction?: number;

  @ViewColumn({
    name: "ranking_n"
  })
  citizen_ranking_ranking?: number;

  @ViewColumn({
    name: "ranking_date_t"
  })
  citizen_ranking_ranking_date?: Date;

  @ViewColumn({
    name: "cit_rank_insert_date_t"
  })
  citizen_ranking_insert_date?: Date;

  @ViewColumn({
    name: "cit_rank_insert_user_s"
  })
  citizen_ranking_insert_user?: string;

  @ViewColumn({
    name: "cit_rank_update_date_t"
  })
  citizen_ranking_update_date?: Date;

  @ViewColumn({
    name: "cit_rank_update_user_s"
  })
  citizen_ranking_update_user?: string;

  @ViewColumn({
    name: "cit_rank_enabled_b"
  })
  citizen_ranking_enabled?: boolean;

  @ViewColumn({
    name: "award_period_id_n"
  })
  award_period_id: number;

  @ViewColumn({
    name: "aw_per_aw_period_start_d"
  })
  award_period_start: Date;

  @ViewColumn({
    name: "aw_per_aw_period_end_d"
  })
  award_period_end: Date;

  @ViewColumn({
    name: "aw_grace_period_n"
  })
  award_period_grace_period: number;

  @ViewColumn({
    name: "amount_max_n"
  })
  award_period_amount_max: number;

  @ViewColumn({
    name: "trx_volume_min_n"
  })
  award_period_trx_volume_min: number;

  @ViewColumn({
    name: "trx_eval_max_n"
  })
  award_period_trx_eval_max: number;

  @ViewColumn({
    name: "ranking_min_n"
  })
  award_period_ranking_min: number;

  @ViewColumn({
    name: "trx_cashback_max_n"
  })
  award_period_trx_cashback_max: number;

  @ViewColumn({
    name: "period_cashback_max_n"
  })
  award_period_cashback_max: number;

  @ViewColumn({
    name: "cashback_perc_n"
  })
  award_period_cashback_perc: number;

  @ViewColumn({
    name: "aw_per_insert_date_t"
  })
  award_period_insert_date?: Date;

  @ViewColumn({
    name: "aw_per_insert_user_s"
  })
  award_period_insert_user?: string;

  @ViewColumn({
    name: "aw_per_update_date_t"
  })
  award_period_update_date?: Date;

  @ViewColumn({
    name: "aw_per_update_user_s"
  })
  award_period_update_user?: string;

  @ViewColumn({
    name: "aw_per_enabled_b"
  })
  award_period_enabled?: boolean;

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
    if (this.award_winner_amount !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_winner_amount = parseFloat(String(this.award_winner_amount));
    }
    if (this.award_winner_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_winner_id = parseFloat(String(this.award_winner_id));
    }
    if (this.award_winner_jackpot !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_winner_jackpot = parseFloat(String(this.award_winner_jackpot));
    }
    if (this.award_winner_cashback !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_winner_cashback = parseFloat(
        String(this.award_winner_cashback)
      );
    }
    if (this.citizen_ranking_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.citizen_ranking_period_id = parseFloat(
        String(this.citizen_ranking_period_id)
      );
    }
    if (this.citizen_ranking_cashback !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.citizen_ranking_cashback = parseFloat(
        String(this.citizen_ranking_cashback)
      );
    }
    if (this.citizen_ranking_transaction !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.citizen_ranking_transaction = parseFloat(
        String(this.citizen_ranking_transaction)
      );
    }
    if (this.citizen_ranking_ranking !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.citizen_ranking_ranking = parseFloat(
        String(this.citizen_ranking_ranking)
      );
    }
    if (this.award_period_id !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_id = parseFloat(String(this.award_period_id));
    }
    if (this.award_period_grace_period !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_grace_period = parseFloat(
        String(this.award_period_grace_period)
      );
    }
    if (this.award_period_amount_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_amount_max = parseFloat(
        String(this.award_period_amount_max)
      );
    }
    if (this.award_period_trx_volume_min !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_trx_volume_min = parseFloat(
        String(this.award_period_trx_volume_min)
      );
    }
    if (this.award_period_trx_eval_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_trx_eval_max = parseFloat(
        String(this.award_period_trx_eval_max)
      );
    }
    if (this.award_period_ranking_min !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_ranking_min = parseFloat(
        String(this.award_period_ranking_min)
      );
    }
    if (this.award_period_trx_cashback_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_trx_cashback_max = parseFloat(
        String(this.award_period_trx_cashback_max)
      );
    }
    if (this.award_period_cashback_max !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_cashback_max = parseFloat(
        String(this.award_period_cashback_max)
      );
    }
    if (this.award_period_cashback_perc !== undefined) {
      // tslint:disable-next-line: no-object-mutation
      this.award_period_cashback_perc = parseFloat(
        String(this.award_period_cashback_perc)
      );
    }
  }
}
