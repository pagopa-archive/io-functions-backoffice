import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
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

export async function getConnection(
  params: IPostgresConnectionParams
): Promise<Connection> {
  // Use an existing connection inside the connection manager.
  const maybeActiveConnection = getConnectionManager().connections[0];
  if (maybeActiveConnection) {
    return maybeActiveConnection;
  }
  return await createConnection({
    database: params.database,
    entities: [Citizen],
    host: params.host,
    password: params.password,
    port: params.port,
    schema: params.schema,
    ssl: true,
    type: "postgres",
    username: params.username
  });
}

export function getRepository<T>(
  connectionParams: IPostgresConnectionParams,
  t: EntityTarget<T>
): TaskEither<Error, Repository<T>> {
  return tryCatch(
    () => getConnection(connectionParams),
    err => new Error(`Error during porstgres connection [err:${err}]`)
  ).map(connection => connection.getRepository(t));
}
