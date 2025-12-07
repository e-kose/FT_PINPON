import en from "./locales/en.json";
import tr from "./locales/tr.json";
import ku from "./locales/ku.json";

export type SupportedLanguage = "en" | "tr" | "ku";

type TranslationMap = Record<string, string>;
type InterpolationValues = Record<string, string | number | boolean>;

const STORAGE_KEY = "app_language";
const DEFAULT_LANGUAGE: SupportedLanguage = "tr";

const dictionaries: Record<SupportedLanguage, TranslationMap> = {
	en: en as TranslationMap,
	tr: tr as TranslationMap,
	ku: ku as TranslationMap
};

let currentLanguage: SupportedLanguage = getInitialLanguage();

function getInitialLanguage(): SupportedLanguage {
	const stored = safeStorageGet(STORAGE_KEY);
	if (stored && isSupportedLanguage(stored)) {
		return stored;
	}

	const browser = navigator?.language?.split("-")[0]?.toLowerCase();
	if (browser && isSupportedLanguage(browser)) {
		return browser;
	}

	return DEFAULT_LANGUAGE;
}

function safeStorageGet(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeStorageSet(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// ignore storage failures (e.g. private mode)
	}
}

function interpolate(template: string, vars?: InterpolationValues): string {
	if (!vars) return template;
	return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
		const value = vars[key];
		return value !== undefined ? String(value) : "";
	});
}

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
	return lang === "en" || lang === "tr" || lang === "ku";
}

function getDictionary(lang: SupportedLanguage): TranslationMap {
	return dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE];
}

export function t(key: string, vars?: InterpolationValues): string {
	const dictionary = getDictionary(currentLanguage);
	let template = dictionary[key];

	if (!template) {
		template = getDictionary(DEFAULT_LANGUAGE)[key];
	}

	if (!template) {
		return interpolate(key, vars);
	}

	return interpolate(template, vars);
}

export function setLanguage(language: SupportedLanguage): void {
	if (!isSupportedLanguage(language)) {
		console.warn(`[i18n] Unsupported language requested: ${language}`);
		return;
	}

	if (language === currentLanguage) return;

	currentLanguage = language;
	safeStorageSet(STORAGE_KEY, language);

	document.dispatchEvent(
		new CustomEvent("languagechange", {
			detail: { language }
		})
	);
}

export function getLanguage(): SupportedLanguage {
	return currentLanguage;
}

export function getAvailableLanguages(): SupportedLanguage[] {
	return Object.keys(dictionaries).filter(isSupportedLanguage);
}
