import {
  Acquirer_descrEnum as Acquirer,
  Circuit_type_descrEnum as CircuitType,
  Operation_type_descrEnum as OperationType
} from "../generated/definitions/BPDTransaction";

import { Channel_descrEnum as Channel } from "../generated/definitions/PaymentMethodDetails";

export function getOperationType(operationType: string): OperationType {
  switch (operationType) {
    case "00":
      return OperationType.Payment;
    case "01":
      return OperationType.Transfer;
    case "02":
      return OperationType.ApplePay;
    case "03":
      return OperationType.GooglePay;
    default:
      return OperationType.Other;
  }
}

export function getCircuitType(circuitType: string): CircuitType {
  switch (circuitType) {
    case "00":
      return CircuitType.Pagobancomat;
    case "01":
      return CircuitType.Visa;
    case "02":
      return CircuitType.Mastercard;
    case "03":
      return CircuitType.Amex;
    case "04":
      return CircuitType.JCB;
    case "05":
      return CircuitType.UnionPay;
    case "06":
      return CircuitType.Diners;
    case "07":
      return CircuitType.Codice_PostePay;
    case "08":
      return CircuitType.BancomatPay;
    case "09":
      return CircuitType.SatisPay;
    case "10":
      return CircuitType.Circuito_Privativo;
    default:
      return CircuitType.Other;
  }
}

export function getAcquirer(acquirer: string): Acquirer {
  switch (acquirer) {
    case "32875":
      return Acquirer.Nexi;
    case "03069":
      return Acquirer.IntesaSanPaolo;
    case "36081":
      return Acquirer.Poste;
    case "02008":
      return Acquirer.Unicredit;
    case "03268":
      return Acquirer.BancaSella;
    case "03111":
      return Acquirer.Nexi_UBI;
    case "08000":
      return Acquirer.Nexi_ICCREA;
    case "36019":
      return Acquirer.AmericanExpress;
    case "STPAY":
      return Acquirer.SatisPay;
    case "12940":
      return Acquirer.ICCREA;
    case "01005":
      return Acquirer.Axepta_BNP;
    case "COBAN":
      return Acquirer.Bancomat;
    case "BPAY1":
      return Acquirer.BancomatPay;
    case "33604":
      return Acquirer.SiaPay;
    default:
      return Acquirer.Other;
  }
}

export function getChannel(channel: string): Channel {
  switch (channel) {
    case "03268":
      return Channel.BancaSella;
    case "03211":
      return Channel.BancaSella_Other;
    case "36081":
      return Channel.Poste;
    case "STPAY":
      return Channel.SatisPay;
    case "36085":
      return Channel.EnelX;
    case "BPAY1":
      return Channel.BancomatPay;
    case "36003":
      return Channel.Flowe;
    case "32875":
      return Channel.Nexi_YAP;
    case "05555":
      return Channel.Nexi_Issuing_diretto;
    case "04444":
      return Channel.Nexi_Other;
    case "36772":
      return Channel.Hype;
    case "02008":
      return Channel.Unicredit;
    case "app-io-channel":
      return Channel.AppIO;
    default:
      return Channel.Other;
  }
}
