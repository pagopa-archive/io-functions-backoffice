import * as t from "io-ts";
import { NumberFromString } from "italia-ts-commons/lib/numbers";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.interface({
  POSTGRES_DB_NAME: NonEmptyString,

  POSTGRES_HOSTNAME: NonEmptyString,
  POSTGRES_PORT: NumberFromString,

  POSTGRES_PASSWORD: NonEmptyString,
  POSTGRES_USERNAME: NonEmptyString,

  POSTGRES_SCHEMA: NonEmptyString
});

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode({
  ...process.env,
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
