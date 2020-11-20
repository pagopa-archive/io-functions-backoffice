FROM node:10.14.2-alpine

WORKDIR /opt/fixtures

RUN npm install -g ts-node typescript && \
    npm install typeorm pg @types/node azure-storage

COPY docker/fixtures/index.ts /opt/fixtures

CMD ["sh", "-c", "ts-node index"]
