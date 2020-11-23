import { GraphRbacManagementClient } from "@azure/graph";
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { toError } from "fp-ts/lib/Either";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";

export interface IServicePrincipalCreds {
  readonly clientId: string;
  readonly secret: string;
  readonly tenantId: string;
}

export const getGraphRbacManagementClient = (
  adb2cCreds: IServicePrincipalCreds
): TaskEither<Error, GraphRbacManagementClient> =>
  tryCatch(
    () =>
      msRestNodeAuth.loginWithServicePrincipalSecret(
        adb2cCreds.clientId,
        adb2cCreds.secret,
        adb2cCreds.tenantId,
        { tokenAudience: "graph" }
      ),
    toError
  ).map(
    credentials =>
      new GraphRbacManagementClient(credentials, adb2cCreds.tenantId, {
        baseUri: "https://graph.windows.net"
      })
  );
