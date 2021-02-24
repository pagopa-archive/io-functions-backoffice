import { agent } from "@pagopa/ts-commons";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { createClient } from "../generated/api/client";
import { getConfigOrThrow } from "./config";
import { withTimeout } from "./fetch";

const config = getConfigOrThrow();
export const PMApiClient = createClient({
  basePath: config.WALLET_API_BASE_PATH,
  baseUrl: config.WALLET_API_URL,
  fetchApi: withTimeout(5000 as Millisecond)(agent.getHttpsFetch(process.env))
});

// tslint:disable-next-line: no-floating-promises
PMApiClient.getWalletV2({
  "Fiscal-Code": "asd",
  SubscriptionKey: "Asd"
});
