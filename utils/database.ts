import { taskEither, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import {
  Connection,
  createConnection,
  EntityTarget,
  getConnectionManager,
  Repository
} from "typeorm";
import { Citizen } from "../models/citizen";

export interface IPostgresConnectionParams {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
}

export function getConnection(
  params: IPostgresConnectionParams
): TaskEither<Error, Connection> {
  // Use an existing connection inside the connection manager.
  const maybeActiveConnection = getConnectionManager().connections[0];
  if (maybeActiveConnection) {
    return taskEither.of(maybeActiveConnection);
  }
  return tryCatch(
    () =>
      createConnection({
        database: params.database,
        entities: [Citizen],
        host: params.host,
        password: params.password,
        port: params.port,
        schema: params.schema,
        ssl: true,
        type: "postgres",
        username: params.username
      }),
    err => new Error(`Error during postgres connection [err:${err}]`)
  );
}

export function getRepository<T>(
  connectionParams: IPostgresConnectionParams,
  t: EntityTarget<T>
): TaskEither<Error, Repository<T>> {
  return getConnection(connectionParams).map(connection =>
    connection.getRepository(t)
  );
}
