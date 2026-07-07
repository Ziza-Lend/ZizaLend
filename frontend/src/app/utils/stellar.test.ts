import { jest } from "@jest/globals";
import { getAccountUrl, getTxUrl, isValidStellarAddress, truncateHash } from "./stellar";

describe("Stellar Utilities", () => {
  describe("isValidStellarAddress", () => {
    it("should validate a correct Stellar address", () => {
      const validAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2QTWA";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should validate another correct Stellar address", () => {
      const validAddress = "GBHVTBKMJ5PXJW7VDBLCWVYXCXU6BFJFNX4S3HJQEWQYXU2CKFCW4FAA";
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it("should reject an address that is too short", () => {
      const invalidAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTL";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject an address that is too long", () => {
      const invalidAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2QTWEXTRA";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject an address that doesn't start with G", () => {
      const invalidAddress = "ABUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2QTW";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject an address with invalid characters", () => {
      const invalidAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2QT!";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject lowercase letters", () => {
      const invalidAddress = "gbuqwp3bouzx34ulnqg23rq6f4bvwcibtlfl2f7hvrqg5ldhnwy2qtw";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidStellarAddress("")).toBe(false);
    });

    it("should reject null or undefined", () => {
      expect(isValidStellarAddress(null as unknown as string)).toBe(false);
      expect(isValidStellarAddress(undefined as unknown as string)).toBe(false);
    });

    it("should reject non-string types", () => {
      expect(isValidStellarAddress(123 as unknown as string)).toBe(false);
      expect(isValidStellarAddress({} as unknown as string)).toBe(false);
    });

    it("should reject addresses with spaces", () => {
      const invalidAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2 QTW";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });

    it("should reject addresses with invalid base32 characters (like 0, 1, 8, 9)", () => {
      const invalidAddress = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY0123";
      expect(isValidStellarAddress(invalidAddress)).toBe(false);
    });
  });

  describe("truncateHash", () => {
    it("truncates a long hash to start...end", () => {
      const hash = "a".repeat(64);
      expect(truncateHash(hash)).toBe(`${"a".repeat(8)}...${"a".repeat(8)}`);
    });

    it("returns short hash unchanged", () => {
      expect(truncateHash("short")).toBe("short");
    });

    it("respects custom chars arg", () => {
      const hash = "b".repeat(40);
      expect(truncateHash(hash, 4)).toBe(`${"b".repeat(4)}...${"b".repeat(4)}`);
    });
  });

  describe("getTxUrl / getAccountUrl", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("builds URLs using NEXT_PUBLIC_STELLAR_EXPLORER_URL", async () => {
      process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL = "https://example.com/explorer";
      jest.resetModules();
      const stellar = await import("./stellar");

      expect(stellar.getTxUrl("txhash")).toBe("https://example.com/explorer/tx/txhash");
      expect(stellar.getAccountUrl("GABC")).toBe("https://example.com/explorer/account/GABC");
    });

    it("default exports still build paths", () => {
      expect(getTxUrl("txhash")).toContain("/tx/txhash");
      expect(getAccountUrl("GABC")).toContain("/account/GABC");
    });
  });
});
