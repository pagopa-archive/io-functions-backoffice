// tslint:disable: member-access variable-name
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";
import { PaymentMethodStatusEnum } from "../generated/definitions/PaymentMethodStatus";

@ViewEntity("v_bpd_citizen")
export class Citizen {
  @ViewColumn({
    name: "fiscal_code_s"
  })
  fiscal_code: FiscalCode;

  @ViewColumn({
    name: "timestamp_tc_t"
  })
  timestamp_tc: Date;

  @ViewColumn({
    name: "payoff_instr_s"
  })
  payoff_instr?: string;

  @ViewColumn({
    name: "payoff_instr_type_c"
  })
  payoff_instr_type?: string;

  @ViewColumn({
    name: "ctz_insert_date_t"
  })
  insert_date?: Date;

  @ViewColumn({
    name: "ctz_insert_user_s"
  })
  insert_user?: string;

  @ViewColumn({
    name: "ctz_update_date_t"
  })
  update_date?: Date;

  @ViewColumn({
    name: "ctz_update_user_s"
  })
  update_user?: string;

  @ViewColumn({
    name: "enabled_b"
  })
  enabled?: boolean;

  @ViewColumn({
    name: "account_holder_cf_s"
  })
  checkiban_fiscal_code?: string;

  @ViewColumn({
    name: "account_holder_name_s"
  })
  checkiban_name?: string;

  @ViewColumn({
    name: "account_holder_surname_s"
  })
  checkiban_surname?: string;

  @ViewColumn({
    name: "check_instr_status_s"
  })
  checkiban_status?: string;

  @ViewColumn({
    name: "cancellation_t"
  })
  cancellation?: Date;

  @ViewColumn({
    name: "hpan_s"
  })
  payment_instrument_hpan?: string;

  @ViewColumn({
    name: "status_c"
  })
  payment_instrument_status?: PaymentMethodStatusEnum;

  @ViewColumn({
    name: "pay_istr_insert_date_t"
  })
  payment_instrument_insert_date?: Date;

  @ViewColumn({
    name: "pay_istr_insert_user_s"
  })
  payment_instrument_insert_user?: string;

  @ViewColumn({
    name: "pay_istr_update_date_t"
  })
  payment_instrument_update_date?: Date;

  @ViewColumn({
    name: "pay_istr_update_user_s"
  })
  payment_instrument_update_user?: string;

  @ViewColumn({
    // TODO this name contains an error, it should be pay_istr_enable_b
    name: "pay_istr_update_enable_b"
  })
  payment_instrument_enabled?: boolean;

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
  }
}
