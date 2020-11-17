import * as express from "express";
import * as passport from "passport";
import * as winston from "winston";

import { Context } from "@azure/functions";
import { secureExpressApp } from "io-functions-commons/dist/src/utils/express";
import { AzureContextTransport } from "io-functions-commons/dist/src/utils/logging";
import { setAppContext } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "io-functions-express/dist/src/createAzureFunctionsHandler";

import { Citizen } from "../models/citizen";
import { getRepository, IPostgresConnectionParams } from "../utils/database";
import { GetBPDCitizen } from "./handler";

import { getConfigOrThrow } from "../utils/config";
import { GetOAuthVerifier } from "../utils/middleware/oauth_adb2c";
import { setupBearerStrategy } from "../utils/strategy/bearer_strategy";

const config = getConfigOrThrow();

const postgresConfig: IPostgresConnectionParams = {
  database: config.POSTGRES_DB_NAME,
  host: config.POSTGRES_HOSTNAME,
  password: config.POSTGRES_PASSWORD,
  port: config.POSTGRES_PORT,
  schema: config.POSTGRES_SCHEMA,
  username: config.POSTGRES_USERNAME
};

// tslint:disable-next-line: no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

// Setup Express
const app = express();
secureExpressApp(app);

const passportAuthenticator = new passport.Passport();

/**
 * Setup an authentication strategy (oauth) for express endpoints.
 */
setupBearerStrategy(
  passportAuthenticator,
  config.ADB2C_CONFIG,
  async (userId, profile) => {
    // executed when the user is logged in
    // userId === profile.oid
    // req.user === profile
    logger?.info("setupBearerStrategy %s %s", userId, JSON.stringify(profile));
  }
);

// Add express route
app.get(
  "/api/v1/bpd/citizen",
  GetOAuthVerifier(passportAuthenticator, config.ADB2C_POLICY_NAME),
  GetBPDCitizen(
    getRepository(postgresConfig, Citizen),
    config.JWT_SUPPORT_TOKEN_PUBLIC_RSA_CERTIFICATE
  )
);

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
function httpStart(context: Context): void {
  logger = context.log;
  setAppContext(app, context);
  azureFunctionHandler(context);
}

export default httpStart;
