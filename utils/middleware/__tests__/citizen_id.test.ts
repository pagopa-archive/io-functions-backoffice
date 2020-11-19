import { Request } from "express";
import { left, right } from "fp-ts/lib/Either";
import { taskEither } from "fp-ts/lib/TaskEither";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  EmailString,
  FiscalCode,
  NonEmptyString
} from "italia-ts-commons/lib/strings";
import { SupportToken } from "../../../generated/definitions/SupportToken";
import { IServicePrincipalCreds } from "../../adb2c";
import * as adb2cUtils from "../../adb2c";
import { AdUser } from "../../strategy/bearer_strategy";
import { RequestCitizenToFiscalCode } from "../citizen_id";

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;

const aPublicRsaCert = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCc3FR1mjQDrhvaDF8UpdtQQknh
MAyxT1o6eCwWIiF+ZHsnnnn8XI++V11+uqSlRlh9gamt4XKqc8/4vKTKzxBYJPV/
TuJDDBC1kbs6SGpqbMjnHk4hUXeSlxbvuksmnwEzmT7u9jYlCj5Zjmr+pBLKBoTk
FmprTzaax++spskX3QIDAQAB
-----END PUBLIC KEY-----` as NonEmptyString;

const aSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTU0NzU3NywiZXhwIjo4NTE3NTQ3NTc3LCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTkxRk1NMTg4WUJNQks3WEZCRzdZQUoifQ.jvj2JEtxHhyFZJbzdeFfymyEEOhD4FPBm2wjNwStWMFqbD8B8CuKEAN_fl6tBrASdI0ZW2XfQujP_TejMFiAjvf696FZKUIyIJo58iOb0nfyRwTCCWUYuyFgkvVMnuMSo47rzp7LUSYx8VUaqz5pJLK3p8w9C6Q-yxrvxGJOZ6M` as SupportToken;
const anInvalidSupportToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXNjYWxDb2RlIjoiQUFBQkJCMDFDMDJEMzQ1RCIsImlhdCI6MTYwNTU0NzYzOCwiZXhwIjoxNjA1NTQ3NjM5LCJpc3MiOiJpby1iYWNrZW5kIiwianRpIjoiMDFFUTkxSEZaTUdGWkdFODUzTlg0TjIwTjYifQ.ENAJhnQB19jUKDYXyvf9LIps9tsRMGUIhsYKyBx8KQbhytKBzRBYaCskuvkHQbEE-CdK2kD66RoQIeg3-ulgA6uFe1aPrsAVS9sbxHKaz_xgHbB6MmyPiRYF9vuv-HsiVHLcL-XNOtczDmGdAsBz-uugeMkk2BjXqR2hf7hgP5Y` as SupportToken;

const mockAdb2cCreds: IServicePrincipalCreds = {
  clientId: "aClientId",
  secret: "aSecret",
  tenantId: "aTenantId"
};
const anAdminGroup = "Admin" as NonEmptyString;
const aCacheTTL = 60480 as NonNegativeInteger;
const aUserOid = "A1234sfdf-r2ewfdsfsf-asfer2fs" as NonEmptyString;

const mockHeader = jest.fn();
const mockUser: AdUser = {
  emails: ["user@mail.com" as EmailString],
  family_name: "family_name",
  given_name: "given_name",
  groups: [anAdminGroup],
  oid: aUserOid
};
const mockRequest = ({
  header: mockHeader,
  user: mockUser
} as unknown) as Request;

const getMemberGroupsMock = jest.fn();
const getGroupMock = jest.fn();
const mockGraphClient = {
  groups: {
    get: getGroupMock
  },
  users: {
    getMemberGroups: getMemberGroupsMock
  }
};
jest.spyOn(adb2cUtils, "getGraphRbacManagementClient").mockImplementation(() =>
  // tslint:disable-next-line: no-any
  taskEither.of(mockGraphClient as any)
);

describe("RequestCitizenToFiscalCode", () => {
  it("should succeded if the header contain a plain fiscal code", async () => {
    mockHeader.mockImplementationOnce(() => aFiscalCode);
    getMemberGroupsMock.mockImplementationOnce(() =>
      Promise.resolve(["aaaaaa-bbbbbb"])
    );
    getGroupMock.mockImplementationOnce(() =>
      Promise.resolve({ displayName: anAdminGroup })
    );
    const response = await RequestCitizenToFiscalCode(
      aPublicRsaCert,
      mockAdb2cCreds,
      anAdminGroup,
      aCacheTTL
    )(mockRequest);
    expect(response).toEqual(
      right({ fiscalCode: aFiscalCode, user: mockUser })
    );
  });
  it("should extract a fiscalCode from a valid JWT provided in header", async () => {
    mockHeader.mockImplementationOnce(() => aSupportToken);
    const response = await RequestCitizenToFiscalCode(
      aPublicRsaCert,
      mockAdb2cCreds,
      anAdminGroup,
      aCacheTTL
    )(mockRequest);
    expect(response).toEqual(
      right({ fiscalCode: aFiscalCode, user: mockUser })
    );
  });
  it("should return a Validation error if the header is empty", async () => {
    mockHeader.mockImplementationOnce(() => undefined);
    const response = await RequestCitizenToFiscalCode(
      aPublicRsaCert,
      mockAdb2cCreds,
      anAdminGroup,
      aCacheTTL
    )(mockRequest);
    expect(response).toEqual(
      left({
        apply: expect.any(Function),
        detail: expect.any(String),
        kind: "IResponseErrorValidation"
      })
    );
  });

  it("should return a unauthorized if the JWT token is invalid ", async () => {
    mockHeader.mockImplementationOnce(() => anInvalidSupportToken);
    const response = await RequestCitizenToFiscalCode(
      aPublicRsaCert,
      mockAdb2cCreds,
      anAdminGroup,
      aCacheTTL
    )(mockRequest);
    expect(response).toEqual(
      left({
        apply: expect.any(Function),
        detail: expect.any(String),
        kind: "IResponseErrorForbiddenNotAuthorized"
      })
    );
  });
});
