/*
 *  OpenID Connect strategy for passport / express.
 */
import { Request } from "express";
import * as t from "io-ts";
import * as passport from "passport";

import { EmailString, NonEmptyString } from "italia-ts-commons/lib/strings";
import {
  BearerStrategy,
  IBearerStrategyOptionWithRequest
} from "passport-azure-ad";

/**
 * Format of the Active directory B2C user data.
 * See the ADB2C tenant configuration for custom attributes (extensions).
 */
export const AdUser = t.interface({
  emails: t.array(EmailString),
  family_name: t.string,
  given_name: t.string,
  oid: NonEmptyString
});

export type AdUser = t.TypeOf<typeof AdUser>;

// -----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
//
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
//
// -----------------------------------------------------------------------------

/**
 * Calls a callback on the logged in user's profile.
 */
export const setupBearerStrategy = (
  passportAuthenticator: passport.Authenticator,
  creds: IBearerStrategyOptionWithRequest,
  cb: (userId: string, profile: AdUser) => Promise<void>
) => {
  passportAuthenticator.use(
    "oauth-bearer",
    new BearerStrategy(
      creds,
      (
        _: Request,
        // tslint:disable-next-line: no-any
        profile: any,
        done: (err: Error | undefined, profile?: AdUser) => void
      ) => {
        return cb(profile.oid as string, profile)
          .then(() => {
            return done(undefined, profile);
          })
          .catch(e => {
            return done(e);
          });
      }
    )
  );
};
