import { EmailString, NonEmptyString } from "italia-ts-commons/lib/strings";
import * as jwt from "jsonwebtoken";
import { RedisClient } from "redis";
import { context } from "../../__mocks__/durable-functions";
import { FiscalCode } from "../../generated/definitions/FiscalCode";
import { SupportToken } from "../../generated/definitions/SupportToken";
import { BLACKLIST_SUPPORT_TOKEN_PREFIX } from "../../utils/citizen_id";
import { RequestCitizenToAdUserAndFiscalCode } from "../../utils/middleware/citizen_id";
import { AdUser } from "../../utils/strategy/bearer_strategy";
import { BlacklistSupportTokenHandler } from "../handler";

const mockSet = jest
  .fn()
  .mockImplementation((_, __, ___, ____, cb) => cb(undefined, "OK"));
const mockRedisClient = ({
  set: mockSet
} as unknown) as RedisClient;

const aFiscalCode = "AAABBB01C02D345D" as FiscalCode;
const aTimestamp = new Date();

const anAuthenticatedUser: AdUser = {
  emails: ["email@example.com" as EmailString],
  family_name: "Surname",
  given_name: "Name",
  oid: "anUserOID" as NonEmptyString
};

const aUserAndFiscalCode: RequestCitizenToAdUserAndFiscalCode = {
  citizenIdType: "FiscalCode",
  fiscalCode: aFiscalCode,
  user: anAuthenticatedUser
};

describe("GetBPDAwardsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("should return a success response if support_token is valid", async () => {
    jest.useFakeTimers();
    const expectedExpire = Math.floor(Date.now() / 1000) + 1;
    const aSupportToken = jwt.sign(
      { fiscalCode: aFiscalCode, exp: expectedExpire },
      "secret"
    ) as SupportToken;
    const handler = BlacklistSupportTokenHandler(mockRedisClient);
    const response = await handler(context, aSupportToken, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    expect(mockSet).toBeCalledWith(
      `${BLACKLIST_SUPPORT_TOKEN_PREFIX}${aSupportToken}`,
      aFiscalCode,
      "EX",
      1,
      expect.any(Function)
    );
  });

  it("should return an error response if support_token is invalid", async () => {
    const anInvalidSupportToken = jwt.sign(
      { fiscalCode: aFiscalCode },
      "secret"
    ) as SupportToken;
    const handler = BlacklistSupportTokenHandler(mockRedisClient);
    const response = await handler(
      context,
      anInvalidSupportToken,
      aUserAndFiscalCode
    );

    expect(response.kind).toBe("IResponseErrorInternal");
    expect(mockSet).not.toBeCalled();
  });

  it("should return an error response if redis save fails", async () => {
    jest.useFakeTimers();
    const expectedExpire = Math.floor(Date.now() / 1000) + 1;
    const aSupportToken = jwt.sign(
      { fiscalCode: aFiscalCode, exp: expectedExpire },
      "secret"
    ) as SupportToken;
    mockSet.mockImplementationOnce((_, __, ___, ____, cb) =>
      cb(new Error("Redis Error"))
    );
    const handler = BlacklistSupportTokenHandler(mockRedisClient);
    const response = await handler(context, aSupportToken, aUserAndFiscalCode);

    expect(response.kind).toBe("IResponseErrorInternal");
    expect(mockSet).toBeCalledTimes(1);
  });
});
