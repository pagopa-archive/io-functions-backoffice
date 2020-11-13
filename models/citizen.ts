// tslint:disable: member-access variable-name
import * as t from "io-ts";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { enumType } from "italia-ts-commons/lib/types";
import { AfterLoad, ViewColumn, ViewEntity } from "typeorm";
import { Iban } from "../generated/definitions/Iban";

export enum StatusEnum {
  "ACTIVE" = "ACTIVE",

  "INACTIVE" = "INACTIVE"
}

export const Status = enumType<StatusEnum>(StatusEnum, "status");
export type Status = t.TypeOf<typeof Status>;

@ViewEntity("citizen_profile")
export class Citizen {
  @ViewColumn()
  fiscal_code: FiscalCode;

  @ViewColumn()
  pay_off_instr?: Iban;

  @ViewColumn()
  onboarding_date?: Date;

  @ViewColumn()
  onboarding_issuer_id?: string;

  @ViewColumn()
  update_date?: Date;

  @ViewColumn()
  update_user?: string;

  @ViewColumn()
  payment_instrument_hpan?: string;

  @ViewColumn()
  payment_instrument_enabled?: boolean;

  @ViewColumn()
  citizen_enabled?: boolean;

  @ViewColumn()
  timestamp_tc: Date;

  @ViewColumn()
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
