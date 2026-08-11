import { Router, type IRouter } from "express";
import {
  CreateChefRecipeBody,
  CreateChefRecipeResponse,
  ExplainTutorTextBody,
  ExplainTutorTextResponse,
  GetMarketSnapshotResponse,
  GetStockSnapshotResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const messages = {
  km: {
    ingredients: "សូមបញ្ចូលគ្រឿងផ្សំ!",
    text: "សូមបញ្ចូលអត្ថបទ!",
  },
  en: {
    ingredients: "Please enter ingredients!",
    text: "Please enter text!",
  },
  zh: {
    ingredients: "请输入食材！",
    text: "请输入文本！",
  },
} as const;

type SupportedLanguage = keyof typeof messages;

function requestLanguage(value: unknown): SupportedLanguage {
  return value === "km" || value === "zh" ? value : "en";
}

router.post("/tools/chef", (req, res): void => {
  const parsed = CreateChefRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    const lang = requestLanguage(req.body?.lang);
    res.status(400).json({ status: "error", message: messages[lang].ingredients });
    return;
  }

  const { ingredients, cuisine, lang } = parsed.data;
  const content =
    lang === "en"
      ? {
          recipeName: `${cuisine} style: special ${ingredients} mix`,
          instructions: [
            "1. Prepare all fresh ingredients.",
            "2. Heat a pan with a little vegetable oil.",
            "3. Stir-fry everything until cooked and fragrant.",
          ],
          calories: "380 kcal",
        }
      : lang === "zh"
        ? {
            recipeName: `${cuisine}风味：特制${ingredients}炒菜`,
            instructions: [
              "1. 准备好所有新鲜食材。",
              "2. 锅中放少量油烧热。",
              "3. 翻炒均匀至熟透并散发香味。",
            ],
            calories: "380 千卡",
          }
        : {
            recipeName: `របៀបធ្វើម្ហូប ${cuisine}៖ ឆា${ingredients} ពិសេស`,
            instructions: [
              "១. រៀបចំគ្រឿងផ្សំឱ្យបានស្អាតបាត។",
              "២. ដុតខ្ទះឱ្យក្តៅ ហើយចាក់ប្រេងបន្តិច។",
              "៣. ឆាបញ្ចូលគ្នាឱ្យឆ្អិនល្មម និងមានក្លិនឈ្ងុយ។",
            ],
            calories: "380 kcal",
          };

  res.json(
    CreateChefRecipeResponse.parse({
      status: "success",
      ...content,
    }),
  );
});

router.post("/tools/tutor", (req, res): void => {
  const parsed = ExplainTutorTextBody.safeParse(req.body);
  if (!parsed.success) {
    const lang = requestLanguage(req.body?.lang);
    res.status(400).json({ status: "error", message: messages[lang].text });
    return;
  }

  const { text, lang } = parsed.data;
  const content =
    lang === "en"
      ? {
          translation: `Translated context: “${text}”`,
          explanation:
            "The sentence has a clear structure and can work in both formal and everyday conversation.",
        }
      : lang === "zh"
        ? {
            translation: `翻译内容：“${text}”`,
            explanation: "句子结构清晰，适用于正式和日常交流。",
          }
        : {
            translation: `អត្ថន័យបកប្រែ៖ «${text}»`,
            explanation:
              "ប្រយោគមានទម្រង់ច្បាស់លាស់ អាចប្រើបានទាំងក្នុងការសន្ទនាផ្លូវការ និងប្រចាំថ្ងៃ។",
          };

  res.json(
    ExplainTutorTextResponse.parse({
      status: "success",
      original: text,
      ...content,
    }),
  );
});

router.get("/tools/market", (_req, res): void => {
  res.json(
    GetMarketSnapshotResponse.parse({
      status: "success",
      updatedAt: new Date().toISOString(),
      gold: {
        local: "$2,650 / 1 damlung",
        global: "$2,680.50 / oz spot XAU",
      },
      currency: {
        USD_KHR: "4,050 KHR",
        USD_THB: "34.50 THB",
        USD_CNY: "7.22 CNY",
        EUR_USD: "$1.08",
      },
      fuel: {
        super: "4,350 KHR/L",
        regular: "3,950 KHR/L",
        diesel: "3,800 KHR/L",
      },
    }),
  );
});

router.get("/tools/stocks", (_req, res): void => {
  res.json(
    GetStockSnapshotResponse.parse({
      status: "success",
      updatedAt: new Date().toISOString(),
      csx: {
        ABC: "9,800 KHR (+0.51%)",
        PAS: "12,100 KHR (+1.25%)",
        CGSM: "2,420 KHR (-0.10%)",
      },
      global: {
        NVDA: "$130.50 (+2.10%)",
        AAPL: "$225.00 (+0.85%)",
        TSLA: "$210.30 (-1.15%)",
        MSFT: "$440.20 (+0.45%)",
      },
    }),
  );
});

export default router;
