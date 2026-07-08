import "@testing-library/jest-dom";

// ─── next-intl mock ───────────────────────────────────────────────────────────
//
// next-intl ships ESM that ships ESM, which Jest can't transform by default
// even with `transformIgnorePatterns`. Components that need translations
// import `useTranslations` and (in layout/test wrapper code) import
// `NextIntlClientProvider`; we replace both with a JSON-backed stub so unit
// tests can render the rest of the tree without touching the real provider.
//
// The stub resolves `useTranslations(namespace)(key, params)` against the
// project's `messages/en.json` tree using dotted paths
// (`wallet.connect.title` → en.wallet.connect.title), with `{name}` style
// placeholder interpolation against `params`. Unknown/untranslated keys fall
// back to the dotted key string so a test using the wrong key surfaces
// immediately instead of silently rendering `undefined`.

type Messages = Record<string, unknown>;

const enMessages: Messages = require("./messages/en.json") as Messages;

function lookup(obj: Messages, segments: string[]): unknown {
  let cur: unknown = obj;
  for (const segment of segments) {
    if (cur && typeof cur === "object" && segment in (cur as Messages)) {
      cur = (cur as Messages)[segment];
    } else {
      return undefined;
    }
  }
  return cur;
}

function interpolate(template: string, params: Record<string, unknown> | undefined): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

jest.mock("next-intl", () => {
  function useTranslations(namespace?: string) {
    return (key: string, params?: Record<string, unknown>): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const value = lookup(enMessages, fullKey.split("."));
      if (typeof value !== "string") {
        return key;
      }
      return interpolate(value, params);
    };
  }

  return {
    __esModule: true,
    useTranslations,
    useLocale: () => "en",
    useMessages: () => enMessages,
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});
