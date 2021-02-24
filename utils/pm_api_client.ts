import { agent } from "@pagopa/ts-commons";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { createClient } from "../generated/api/client";
import { getConfigOrThrow } from "./config";
import { withTimeout } from "./fetch";

const config = getConfigOrThrow();
export const PMApiClient = createClient({
  basePath: config.CSTAR_API_BASE_PATH,
  baseUrl: config.CSTAR_API_URL,
  fetchApi: withTimeout(5000 as Millisecond)(agent.getHttpsFetch(process.env))
});
