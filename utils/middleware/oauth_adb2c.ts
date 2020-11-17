import { NextFunction, Request, Response } from "express";
import * as passport from "passport";
/**
 * Express middleware that check oauth token.
 */
export const GetOAuthVerifier = (
  passportAuthenticator: passport.Authenticator,
  policyName: string
) => (req: Request, res: Response, next: NextFunction) => {
  // adds policyName in case none is provided
  // tslint:disable-next-line:no-object-mutation
  req.query.p = policyName;
  passportAuthenticator.authenticate("oauth-bearer", {
    response: res,
    session: false
  } as {})(req, res, next);
};
