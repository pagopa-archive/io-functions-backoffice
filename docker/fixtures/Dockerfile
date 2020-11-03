FROM node:10.14.2-alpine

WORKDIR /opt/cosmosdb

RUN npm install -g ts-node typescript && \
    npm install typeorm pg @types/node

COPY docker/fixtures/index.ts /opt/cosmosdb
COPY docker/fixtures/dump.pgsql /opt/cosmosdb

CMD ["sh", "-c", "ts-node index"]
