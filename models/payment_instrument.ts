// tslint:disable: member-access variable-name
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";
import { PaymentMethodStatusEnum } from "../generated/definitions/PaymentMethodStatus";

@ViewEntity("v_bpd_payment_instrument")
export class PaymentIntrument {
  @ViewColumn({
    name: "fiscal_code_s"
  })
  fiscal_code: FiscalCode;

  @ViewColumn({
    name: "hpan_s"
  })
  hpan: string;

  @ViewColumn({
    name: "status_c"
  })
  status: PaymentMethodStatusEnum;

  @ViewColumn({
    name: "channel_s"
  })
  channel: string;

  @ViewColumn({
    name: "enabled_b"
  })
  enabled: boolean;

  @ViewColumn({
    name: "enrollment_t"
  })
  enrollment: Date;

  @ViewColumn({
    name: "cancellation_t"
  })
  cancellation?: Date;

  @ViewColumn({
    name: "paym_istr_insert_date_t"
  })
  insert_date?: Date;

  @ViewColumn({
    name: "paym_istr_insert_user_s"
  })
  insert_user?: string;

  @ViewColumn({
    name: "paym_istr_update_date_t"
  })
  update_date?: Date;

  @ViewColumn({
    name: "paym_istr_update_user_s"
  })
  update_user?: string;

  @ViewColumn({
    name: "paym_istr_hist_insert_date_t"
  })
  hist_insert_date?: Date;

  @ViewColumn({
    name: "paym_istr_hist_insert_user_s"
  })
  hist_insert_user?: string;

  @ViewColumn({
    name: "paym_istr_hist_update_date_t"
  })
  hist_update_date?: Date;

  @ViewColumn({
    name: "paym_istr_hist_update_user_s"
  })
  hist_update_user?: string;

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
