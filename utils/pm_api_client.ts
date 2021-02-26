import { agent } from "@pagopa/ts-commons";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { Client, createClient } from "../generated/api/client";
import { getConfigOrThrow } from "./config";
import { withTimeout } from "./fetch";

const config = getConfigOrThrow();
export function GetWalletApiClient(): Client<"SubscriptionKey"> {
  return createClient<"SubscriptionKey">({
    basePath: config.CSTAR_API_BASE_PATH,
    baseUrl: config.CSTAR_API_URL,
    fetchApi: withTimeout(5000 as Millisecond)(
      agent.getHttpsFetch(process.env)
    ),
    withDefaults: op => params =>
      op({ ...params, SubscriptionKey: config.CSTAR_SUBSCRIPTION_KEY })
  });
}

export type GetWalletApiClient = typeof GetWalletApiClient;
