import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ro from "./locales/ro.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "ro",
    resources: {
      ro: { translation: ro },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
