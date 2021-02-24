# IO Functions Backoffice

[![codecov](https://codecov.io/gh/pagopa/io-functions-backoffice/branch/master/graph/badge.svg)](https://codecov.io/gh/pagopa/io-functions-backoffice)
[![Build Status](https://dev.azure.com/pagopa-io/io-backoffice/_apis/build/status/pagopa.io-backoffice-backend?branchName=master)](https://dev.azure.com/pagopa-io/io-backoffice/_build/latest?definitionId=37&branchName=master)

This repository contains the code for the backend used by the Backoffice.

## Local development

```shell
cp env.example .env
```

Replace in `.env` file the envs `JWT_SUPPORT_TOKEN_PUBLIC_RSA_CERTIFICATE`, `ADB2C_CLIENT_KEY` and `ADB2C_TENANT_ID` with the proper values.

```shell
yarn install
yarn build
docker-compose up -d --build
docker-compose logs -f functions
open http://localhost/some/path/test
```

## Deploy

Deploy appens with this [pipeline](./azure-pipelines.yml)
(workflow) configured on [Azure DevOps - io-backoffice](https://dev.azure.com/pagopa-io/io-backoffice).

## Environment variables

Those are all Environment variables needed by the application:

| Variable name                            | Description                                                                       | type   |
|------------------------------------------|-----------------------------------------------------------------------------------|--------|
| DASHBOARD_STORAGE_CONNECTION_STRING      | Storage connection string                                                         | string |
| SLOT_TASK_HUBNAME                        | The unique slot task hubname                                                      | string |
| POSTGRES_HOSTNAME                        | Host for the postgres database                                                    | string |
| POSTGRES_PORT                            | Port for the postgres database                                                    | number |
| POSTGRES_USERNAME                        | Username for the postgres database                                                | string |
| POSTGRES_PASSWORD                        | Password for the postgres database                                                | string |
| POSTGRES_DB_NAME                         | Postgres database name                                                            | string |
| POSTGRES_SCHEMA                          | Postgres schema name                                                              | string |
| JWT_SUPPORT_TOKEN_PUBLIC_RSA_CERTIFICATE | The support token's public certificate used to verify JWT's signature             | string |
| ADB2C_TENANT_NAME                        | The Active Directory B2C tenant name                                              | string |
| ADB2C_TENANT_ID                          | The Active Directory B2C tenant identifier                                        | string |
| ADB2C_CLIENT_ID                          | The Active Directory B2C client identifier                                        | string |
| ADB2C_CLIENT_KEY                         | The Active Directory B2C client's secret key                                      | string |
| ADB2C_POLICY_NAME                        | The Active Directory B2C policy name                                              | string |
| ADB2C_ADMIN_GROUP_NAME                   | The Active Directory B2C group that identifies admin users                        | string |
| IN_MEMORY_CACHE_TTL                      | A time to live value for in memory cache that stores user's groups                | number |
| CSTAR_API_URL                            | The base url of the PM service                                                    | string |
| CSTAR_API_BASE_PATH                      | Tha base path for the getWalletV2 URL                                             | string |
| CSTAR_SUBSCRIPTION_KEY                   | The CStar APIM subscription key                                                   | string |