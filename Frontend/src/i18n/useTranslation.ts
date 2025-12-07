import { getLanguage, setLanguage, t, type SupportedLanguage } from "./lang";

type LanguageChangeCallback = (language: SupportedLanguage) => void;

export function translate(key: string, vars?: Record<string, string | number | boolean>): string {
	return t(key, vars);
}

export function changeLanguage(language: SupportedLanguage): void {
	setLanguage(language);
}

export function observeLanguageChange(callback: LanguageChangeCallback): () => void {
	const handler = (event: Event) => {
		const detail = (event as CustomEvent<{ language: SupportedLanguage }>).detail;
		if (detail?.language) {
			callback(detail.language);
		} else {
			callback(getLanguage());
		}
	};

	document.addEventListener("languagechange", handler as EventListener);
	return () => document.removeEventListener("languagechange", handler as EventListener);
}

export { getLanguage, setLanguage };
