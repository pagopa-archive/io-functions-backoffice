import { fromNullable } from "fp-ts/lib/Either";
import {
  fromEither,
  fromPredicate,
  taskEither,
  TaskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import {
  Connection,
  createConnection,
  EntityTarget,
  getConnectionManager,
  Repository
} from "typeorm";
import { Award } from "../models/award";
import { Citizen } from "../models/citizen";
import { PaymentIntrument } from "../models/payment_instrument";
import { Transaction } from "../models/transaction";

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
  return tryCatch(
    async () => getConnectionManager(),
    () => Error("Error loading connection manager")
  )
    .chain(_ =>
      fromEither(
        fromNullable(new Error("Connection pool empty"))(
          _.connections[0] as Connection | undefined
        )
      )
    )
    .foldTaskEither(
      _ =>
        // The connection pool is empty a new connection will be created.
        tryCatch(
          () =>
            createConnection({
              database: params.database,
              entities: [Citizen, Transaction, PaymentIntrument, Award],
              host: params.host,
              password: params.password,
              port: params.port,
              schema: params.schema,
              ssl: true,
              type: "postgres",
              username: params.username
            }),
          err => new Error(`Error during postgres connection [err:${err}]`)
        ),
      _ => taskEither.of(_)
    )
    .chain(_ =>
      // forward the connection from the connection pool if is connected.
      fromPredicate<Error, Connection>(
        connection => connection.isConnected,
        () => new Error("Connection is disconnected")
      )(_).foldTaskEither(
        () =>
          // if the connection from the connection pool is disconneted try to reconnect
          tryCatch(
            () => _.connect(),
            err => new Error(`Error during postgres re-connection [err:${err}]`)
          ),
        connection => taskEither.of(connection)
      )
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
