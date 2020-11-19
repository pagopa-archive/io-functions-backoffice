import { fromNullable } from "fp-ts/lib/Option";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { AdUser } from "./strategy/bearer_strategy";

export const isAdminAuthLevel = (
  adUser: AdUser,
  canQueryFiscalCodeGroup: NonEmptyString
) =>
  fromNullable(adUser.groups)
    .getOrElse([])
    .includes(canQueryFiscalCodeGroup);
