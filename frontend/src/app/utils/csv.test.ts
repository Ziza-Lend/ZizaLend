import { rowsToCsv } from "./csv";

describe("csv utils", () => {
  describe("rowsToCsv", () => {
    it("returns empty string for empty rows with no headers", () => {
      expect(rowsToCsv([])).toBe("");
    });

    it("returns header line for empty rows with headers", () => {
      expect(rowsToCsv([], ["a", "b"])).toBe("a,b\n");
    });

    it("quotes values containing commas", () => {
      expect(rowsToCsv([{ a: "hello,world" }], ["a"])).toBe('a\n"hello,world"\n');
    });

    it("doubles embedded quotes and wraps value in quotes", () => {
      expect(rowsToCsv([{ a: 'he said "hi"' }], ["a"])).toBe('a\n"he said ""hi"""\n');
    });

    it("quotes values containing newlines", () => {
      expect(rowsToCsv([{ a: "line1\nline2" }], ["a"])).toBe('a\n"line1\nline2"\n');
    });

    it("derives headers when omitted (union of keys)", () => {
      expect(rowsToCsv([{ a: 1 }, { b: 2 }]).startsWith("a,b\n")).toBe(true);
    });

    it("renders null/undefined as empty string", () => {
      expect(rowsToCsv([{ a: null, b: undefined }], ["a", "b"])).toBe("a,b\n,\n");
    });
  });
});
