import * as express from "express";
import * as http from "http";

const app = express();

app.get("/backoffice/v1/external/walletv2", (_, res) => {
  // tslint:disable-next-line: no-console
  console.log("Request headers: ", JSON.stringify(_.headers));
  const aCreditCard = {
    blurredNumber: "1234",
    brand: "VISA",
    brandLogo: "https://example.com/visa.png",
    expireMonth: "1",
    expireYear: "2021",
    hashPan: "807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966",
    holder: "Mario Rossi",
    htokenList: ["token1", "token2"],
    issuerAbiCode: "30012",
    type: "CRD"
  };

  const aBancomat = {
    blurredNumber: "1234",
    brand: "BANCOMAT",
    brandLogo: "https://example.com/bacomat.png",
    expireMonth: "1",
    expireYear: "2021",
    hashPan: "7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29",
    holder: "Mario Rossi",
    htokenList: ["token1", "token2"],
    issuerAbiCode: "30012",
    type: "DEB"
  };

  const aBancomat2 = {
    blurredNumber: "1234",
    brand: "BANCOMAT",
    brandLogo: "https://example.com/bacomat.png",
    expireMonth: "1",
    expireYear: "2021",
    hashPan: "99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a297726b",
    holder: "Mario Rossi",
    htokenList: ["token1", "token2"],
    issuerAbiCode: "30012",
    type: "DEB"
  };
  res.json({
    data: [
      {
        idWallet: 1,
        createDate: "2020-10-23 19:52:22",
        updateDate: "2020-10-23 19:52:22",
        enableableFunctions: ["pagoPA", "BPD", "FA"],
        onboardingChannel: "IO",
        info: aCreditCard,
        walletType: "Card"
      },
      {
        idWallet: 2,
        createDate: "2020-07-23 16:13:00",
        updateDate: "2020-10-23 19:52:22",
        enableableFunctions: ["BPD"],
        onboardingChannel: "IO",
        info: aBancomat,
        walletType: "Bancomat"
      },
      {
        idWallet: 3,
        createDate: "2020-07-23 16:13:00",
        updateDate: "2020-10-23 19:52:22",
        enableableFunctions: ["BPD"],
        onboardingChannel: "IO",
        info: aBancomat2,
        walletType: "Bancomat"
      }
    ]
  });
});

const server = http.createServer(app);
server.listen(process.env.PORT);
server.once("listening", () => {
  // tslint:disable-next-line: no-console
  console.log(`Listening on port ${process.env.PORT}`);
});
