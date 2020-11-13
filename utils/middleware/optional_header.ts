// TODO: Move this file into io-functions-commons
import { right } from "fp-ts/lib/Either";
import { none, Option, some } from "fp-ts/lib/Option";
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
export function OptionalHeaderMiddleware<S, A>(
  name: string,
  type: t.Type<A, S>
): IRequestMiddleware<"IResponseErrorValidation", Option<A>> {
  return request =>
    new Promise(resolve => {
      // If the parameter is not found return None
      if (request.header(name) === undefined) {
        resolve(right(none));
      }
      const validation = type.decode(request.header(name));
      const result = validation.bimap(
        ResponseErrorFromValidationErrors(type),
        some
      );
      resolve(result);
    });
}
