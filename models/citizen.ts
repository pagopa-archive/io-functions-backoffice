// tslint:disable: member-access variable-name
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { ViewColumn, ViewEntity } from "typeorm";
import { Iban } from "../generated/definitions/Iban";

@ViewEntity("citizen_profile")
export class Citizen {
  @ViewColumn()
  fiscal_code: FiscalCode;

  @ViewColumn()
  pay_off_instr: Iban | null;

  @ViewColumn()
  onboarding_date: Date | null;

  @ViewColumn()
  onboarding_issuer_id: string | null;

  @ViewColumn()
  update_date: Date | null;

  @ViewColumn()
  update_user: string | null;

  @ViewColumn()
  payment_instrument_hpan: string | null;

  @ViewColumn()
  payment_instrument_enabled: boolean | null;

  @ViewColumn()
  citizen_enabled: boolean | null;

  @ViewColumn()
  timestamp_tc: Date;

  @ViewColumn()
  payment_instrument_status: string | null;
}
