import * as express from "express";
import * as http from "http";

const app = express();

app.get("/backoffice/v1/external/walletv2", (_, res) => {
  // tslint:disable-next-line: no-console
  console.log("Request headers: ", JSON.stringify(_.headers));
  const aCreditCard = {
    blurredNumber: "1234",
    brand: "VISA",
    brandLogo: "logo",
    expireMonth: "1",
    expireYear: "2021",
    hashPan: "hash_pan",
    holder: "Mario Rossi",
    htokenList: ["token1", "token2"],
    issuerAbiCode: "30012",
    type: "CRD"
  };

  const aBancomat = {
    blurredNumber: "1234",
    brand: "BANCOMAT",
    brandLogo: "logo",
    expireMonth: "1",
    expireYear: "2021",
    hashPan: "hash_pan",
    holder: "Mario Rossi",
    htokenList: ["token1", "token2"],
    issuerAbiCode: "30012",
    type: "DEB"
  };
  res.json({
    data: [
      {
        idWallet: 1,
        info: aCreditCard,
        walletType: "Card"
      },
      {
        idWallet: 2,
        info: aBancomat,
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
