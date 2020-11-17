import { identity } from "fp-ts/lib/function";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { ResponseErrorFromValidationErrors } from "italia-ts-commons/lib/responses";

/**
 * Returns a request middleware that extract the required user profile
 * in request.user.
 * @param type  The io-ts Type for validating the parameter
 */
export function RequiredExpressUserMiddleware<S, A>(
  type: t.Type<A, S>
): IRequestMiddleware<"IResponseErrorValidation", A> {
  return request =>
    new Promise(resolve => {
      const validation = type.decode(request.user);
      const result = validation.bimap(
        ResponseErrorFromValidationErrors(type),
        identity
      );
      resolve(result);
    });
}
