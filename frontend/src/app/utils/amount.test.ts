import {
  getAssetDecimals,
  getPrecisionError,
  hasInvalidPrecision,
  sanitizeAmountInput,
  toStroops,
} from "./amount";

describe("amount utils", () => {
  describe("getAssetDecimals", () => {
    it("returns known asset decimals", () => {
      expect(getAssetDecimals("XLM")).toBe(7);
      expect(getAssetDecimals("USDC")).toBe(2);
      expect(getAssetDecimals("EURC")).toBe(2);
      expect(getAssetDecimals("PHP")).toBe(2);
    });

    it("falls back for unknown assets", () => {
      expect(getAssetDecimals("UNKNOWN")).toBe(7);
    });
  });

  describe("toStroops", () => {
    it("converts whole and fractional amounts", () => {
      expect(toStroops("1", 7)?.toString()).toBe("10000000");
      expect(toStroops("1.5", 7)?.toString()).toBe("15000000");
      expect(toStroops("0.01", 2)?.toString()).toBe("1");
      expect(toStroops("12.34", 2)?.toString()).toBe("1234");
    });

    it("returns null when precision exceeds decimals", () => {
      expect(toStroops("1.234", 2)).toBeNull();
      expect(toStroops("0.00000001", 7)).toBeNull();
    });
  });

  describe("hasInvalidPrecision / getPrecisionError", () => {
    it("treats values at the limit as valid", () => {
      expect(hasInvalidPrecision("1.12", 2)).toBe(false);
      expect(getPrecisionError("1.12", "USDC")).toBeNull();
    });

    it("flags values over the limit and returns error text", () => {
      expect(hasInvalidPrecision("1.123", 2)).toBe(true);
      expect(getPrecisionError("1.123", "USDC")).toBe("USDC supports at most 2 decimal places.");
    });
  });

  describe("sanitizeAmountInput", () => {
    it("strips non-numeric and collapses multiple dots", () => {
      expect(sanitizeAmountInput("$1,234.56")).toBe("1234.56");
      expect(sanitizeAmountInput("1.2.3")).toBe("1.23");
      expect(sanitizeAmountInput("..1..2..3..")).toBe(".123");
    });
  });
});
