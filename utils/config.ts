import * as t from "io-ts";
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { IBearerStrategyOptionWithRequest } from "passport-azure-ad";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.interface({
  POSTGRES_DB_NAME: NonEmptyString,

  POSTGRES_HOSTNAME: NonEmptyString,
  POSTGRES_PORT: NumberFromString,

  POSTGRES_PASSWORD: NonEmptyString,
  POSTGRES_USERNAME: NonEmptyString,

  POSTGRES_SCHEMA: NonEmptyString,

  ADB2C_CLIENT_ID: NonEmptyString,
  ADB2C_POLICY_NAME: NonEmptyString,
  ADB2C_TENANT_NAME: NonEmptyString,

  ADB2C_CONFIG: t.any // TODO: Define the ADB2C_CONFIG type
});

export const creds: IBearerStrategyOptionWithRequest = {
  // Required. It must be tenant-specific endpoint, common endpoint
  // is not supported to use B2C feature.
  identityMetadata: `https://${process.env.ADB2C_TENANT_NAME}.b2clogin.com/${process.env.ADB2C_TENANT_NAME}.onmicrosoft.com/v2.0/.well-known/openid-configuration`,

  // Required, the client ID of your app in AAD
  clientID: process.env.ADB2C_CLIENT_ID as string,

  // Required, must be true for B2C
  isB2C: true,

  // Required to set to false if you don't want to validate issuer
  validateIssuer: true,

  // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
  issuer: undefined,

  // Required to set to true if the `verify` function has 'req' as the first parameter
  passReqToCallback: true,

  // Optional. The additional scope you want besides 'openid'
  // (1) if you want refresh_token, use 'offline_access'
  // (2) if you want access_token, use the clientID
  // scope: ["offline_access"],
  scope: ["user_impersonation"],

  // Optional, 'error', 'warn' or 'info'
  loggingLevel: "error",

  // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
  clockSkew: undefined,

  policyName: process.env.ADB2C_POLICY_NAME
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode({
  ...process.env,
  ADB2C_CONFIG: creds,
  isProduction: process.env.NODE_ENV === "production"
});

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export function getConfig(): t.Validation<IConfig> {
  return errorOrConfig;
}

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export function getConfigOrThrow(): IConfig {
  return errorOrConfig.getOrElseL(errors => {
    throw new Error(`Invalid configuration: ${readableReport(errors)}`);
  });
}
