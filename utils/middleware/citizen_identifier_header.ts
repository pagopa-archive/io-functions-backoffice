// TODO: Move this file into io-functions-commons
import { right, left } from "fp-ts/lib/Either";
import { fromEither, fromLeft, taskEither } from "fp-ts/lib/TaskEither";
import { fromNullable } from "fp-ts/lib/Option";
import { none, Option, some } from "fp-ts/lib/Option";
import { IRequestMiddleware } from "io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  ResponseErrorFromValidationErrors,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";
import { CitizenID } from "../../generated/definitions/CitizenID";
import { SupportToken } from "../../generated/definitions/SupportToken";
import * as jwt from "jsonwebtoken";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

/**
 * Returns a request middleware that extract an optional
 * parameter in the request.header.
 *
 * @param name  The name of the header
 * @param type  The io-ts Type for validating the parameter
 */
export function CitizenIdentifierHeaderMiddleware<S, A>(
  name: string,
  pubCert: NonEmptyString
): IRequestMiddleware<
  "IResponseErrorValidation" | "IResponseErrorInternal",
  A
> {
  return request => {
    const retValue = fromNullable(request.header(name))
      .foldL(
        () =>
          fromLeft<IResponseErrorInternal, string>(
            ResponseErrorInternal("The header is required")
          ),
        header => taskEither.of(header)
      )
      .foldTaskEither<
        IResponseErrorValidation | IResponseErrorInternal,
        CitizenID
      >(
        e => fromLeft(e),
        id => fromEither(CitizenID.decode(id))
      )
      .chain(id =>
        taskify<IResponseErrorInternal, string | object>(cb =>
          jwt.verify(token, pubCert, { algorithms: ["RS256"] }, cb)
        )().mapLeft(ResponseErrorInternal("Cannot verify JWT token"))
      );

    return void 0;
  };
  //  .mapLeft(() => ResponseErrorInternal("The header is required")));

  /*
    new Promise(resolve => {
      // If the parameter is not found return None
      if (request.header(name) === undefined) {
        resolve(left(ResponseErrorInternal("The header is required")));
      }
      const validation = CitizenID.decode(request.header(name));
      const result = validation.bimap(
        ResponseErrorFromValidationErrors(CitizenID),
        citizenID => SupportToken.is(citizenID)? jwt.verify(citizenID, pubCert, { algorithms: ["RS256"] }, cb) :
      );
      resolve(result);
    });*/
}
