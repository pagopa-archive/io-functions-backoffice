// TODO: Move this file into io-functions-commons
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import { ResponseErrorFromValidationErrors } from "italia-ts-commons/lib/responses";

/**
 * Returns a request middleware that extract an optional
 * parameter in the request.header.
 *
 * @param name  The name of the header
 * @param type  The io-ts Type for validating the parameter
 */
export function RequiredHeaderMiddleware<S, A>(
  name: string,
  type: t.Type<A, S>
): IRequestMiddleware<"IResponseErrorValidation", A> {
  return request =>
    new Promise(resolve => {
      const result = type
        .decode(request.header(name))
        .mapLeft(ResponseErrorFromValidationErrors(type));
      resolve(result);
    });
}
