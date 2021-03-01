FROM node:10.14.2-alpine

WORKDIR /opt/pm

RUN npm install -g ts-node typescript && \
  npm install express @types/node

COPY docker/paymentManager/index.ts /opt/pm

CMD ["sh", "-c", "ts-node index"]