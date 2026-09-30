import type { RegionRecord } from "../types/index.js";

// ISO 3166-1 alpha-2. Language lists are informational (not exhaustive).
export const REGIONS: readonly RegionRecord[] = [
  { code: "KH", englishName: "Cambodia", languages: ["km"] },
  { code: "US", englishName: "United States", languages: ["en", "es"] },
  { code: "GB", englishName: "United Kingdom", languages: ["en"] },
  { code: "AU", englishName: "Australia", languages: ["en"] },
  { code: "CA", englishName: "Canada", languages: ["en", "fr"] },
  { code: "CN", englishName: "China", languages: ["zh"] },
  { code: "TW", englishName: "Taiwan", languages: ["zh"] },
  { code: "HK", englishName: "Hong Kong", languages: ["zh", "en"] },
  { code: "JP", englishName: "Japan", languages: ["ja"] },
  { code: "KR", englishName: "South Korea", languages: ["ko"] },
  { code: "TH", englishName: "Thailand", languages: ["th"] },
  { code: "VN", englishName: "Vietnam", languages: ["vi"] },
  { code: "SA", englishName: "Saudi Arabia", languages: ["ar"] },
  { code: "EG", englishName: "Egypt", languages: ["ar"] },
  { code: "IL", englishName: "Israel", languages: ["he", "ar"] },
  { code: "FR", englishName: "France", languages: ["fr"] },
  { code: "DE", englishName: "Germany", languages: ["de"] },
  { code: "ES", englishName: "Spain", languages: ["es"] },
  { code: "BR", englishName: "Brazil", languages: ["pt"] },
  { code: "PT", englishName: "Portugal", languages: ["pt"] },
  { code: "IN", englishName: "India", languages: ["hi", "bn", "ta", "te", "mr", "gu", "pa", "kn", "en"] },
];
