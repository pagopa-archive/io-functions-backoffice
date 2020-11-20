/**
 * Insert fake data into CosmosDB database emulator.
 */
import { TableService } from "azure-storage";
import * as fs from "fs";
import * as path from "path";
import { createConnection } from "typeorm";

const tableService = new TableService(
  process.env.DASHBOARD_STORAGE_CONNECTION_STRING
);
tableService.createTableIfNotExists(
  process.env.DASHBOARD_LOGS_TABLE_NAME,
  (err, table) => {
    if (err) {
      // tslint:disable-next-line: no-console
      console.error(err);
    }
    // tslint:disable-next-line: no-console
    console.info("Table created: ", table);
  }
);

createConnection({
  database: "postgres",
  host: "host.docker.internal",
  // tslint:disable-next-line: no-hardcoded-credentials
  password: "test",
  port: 5532,
  username: "testuser",

  type: "postgres",

  ssl: true
})
  .then(connection => {
    const query = fs
      .readFileSync(path.join(__dirname, "dump.pgsql"))
      .toString();
    return connection
      .query(query)
      .then(() => connection.close())
      .catch(() => connection.close());
  })
  // tslint:disable-next-line: no-console
  .catch(console.error);
