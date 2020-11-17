// tslint:disable: member-access variable-name
import * as t from "io-ts";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { enumType } from "italia-ts-commons/lib/types";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";

export enum StatusEnum {
  "ACTIVE" = "ACTIVE",

  "INACTIVE" = "INACTIVE"
}

export const Status = enumType<StatusEnum>(StatusEnum, "status");
export type Status = t.TypeOf<typeof Status>;

@ViewEntity("v_bpd_citizen")
export class Citizen {
  @ViewColumn({
    name: "fiscal_code_s"
  })
  fiscal_code: FiscalCode;

  @ViewColumn({
    name: "payoff_instr_s"
  })
  payoff_instr?: string;

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
    name: "hpan_s"
  })
  payment_instrument_hpan?: string;

  @ViewColumn({
    name: "enabled_b"
  })
  citizen_enabled?: boolean;

  @ViewColumn({
    name: "timestamp_tc_t"
  })
  timestamp_tc: Date;

  @ViewColumn({
    name: "status_c"
  })
  payment_instrument_status?: Status;

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
