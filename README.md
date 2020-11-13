# IO Functions Backoffice

[![codecov](https://codecov.io/gh/pagopa/io-functions-backoffice/branch/master/graph/badge.svg)](https://codecov.io/gh/pagopa/io-functions-backoffice)
[![Build Status](https://dev.azure.com/pagopa-io/io-functions-backoffice/_apis/build/status/pagopa.io-functions-backoffice?branchName=master)](https://dev.azure.com/pagopa-io/io-functions-backoffice/_build/latest?definitionId=37&branchName=master)

This repository contains the code for the backend used by the Backoffice.

## Local development

```shell
cp env.example .env
yarn install
yarn build
docker-compose up -d --build
docker-compose logs -f functions
open http://localhost/some/path/test
```

## Deploy

Deploy appens with this [pipeline](./azure-pipelines.yml)
(workflow) configured on [Azure DevOps](https://dev.azure.com).

## Environment variables

Those are all Environment variables needed by the application:

| Variable name                          | Description                                                                       | type   |
|----------------------------------------|-----------------------------------------------------------------------------------|--------|
| DASHBOARD_STORAGE_CONNECTION_STRING    | Storage connection string                                                         | string |
| SLOT_TASK_HUBNAME                      | The unique slot task hubname                                                      | string |
| POSTGRES_HOSTNAME                      | Host for the postgres database                                                    | string |
| POSTGRES_PORT                          | Port for the postgres database                                                    | number |
| POSTGRES_USERNAME                      | Username for the postgres database                                                | string |
| POSTGRES_PASSWORD                      | Password for the postgres database                                                | string |
| POSTGRES_DB_NAME                       | Postgres database name                                                            | string |
| POSTGRES_SCHEMA                        | Postgres schema name                                                              | string |

