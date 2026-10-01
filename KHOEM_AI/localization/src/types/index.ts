export type Direction = "ltr" | "rtl";

export type LanguageStatus =
  | "planned" | "draft" | "partial" | "review" | "verified" | "complete" | "deprecated";

export interface LanguageRecord {
  readonly languageId: string;
  readonly iso639_1?: string;
  readonly iso639_3: string;
  readonly bcp47: string;
  readonly englishName: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly defaultScript: string;
  readonly direction: Direction;
  readonly status: LanguageStatus;
  readonly cldrSupport: boolean;
  readonly notes?: string;
}

export interface LocaleRecord {
  readonly locale: string;
  readonly language: string;
  readonly script?: string;
  readonly region?: string;
  readonly direction: Direction;
  readonly parentLocale?: string;
  readonly status: LanguageStatus;
  readonly fallbackChain: readonly string[];
}

export interface RegionRecord {
  readonly code: string; // ISO 3166-1 alpha-2
  readonly englishName: string;
  readonly languages: readonly string[];
}

export type PluralForms = Partial<Record<"zero" | "one" | "two" | "few" | "many" | "other", string>>;
export type TranslationValue = string | PluralForms;
export type TranslationTree = { readonly [k: string]: string | PluralForms | TranslationTree };
export type FlatTranslations = Record<string, TranslationValue>;
export type TranslationParams = Record<string, string | number>;

export type ErrorCode =
  | "INVALID_LOCALE" | "UNSUPPORTED_LOCALE" | "LANGUAGE_NOT_FOUND" | "LOCALE_NOT_FOUND"
  | "TRANSLATION_NOT_FOUND" | "MISSING_TRANSLATION" | "INVALID_TRANSLATION_KEY"
  | "INVALID_PARAMETERS" | "REGISTRY_VALIDATION_ERROR";

export interface ResolveResult {
  readonly requested: string;
  readonly canonical: string | null;
  readonly resolved: string | null;
  readonly chain: readonly string[];
}

export interface TranslationResult {
  readonly text: string;
  readonly key: string;
  readonly requestedLocale: string;
  readonly resolvedLocale: string | null;
  readonly usedLocale: string | null;
  readonly fallbackUsed: boolean;
  readonly missing: boolean;
}
