import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../i18n/locales/en.json';
import hi from '../i18n/locales/hi.json';
import bn from '../i18n/locales/bn.json';
import mr from '../i18n/locales/mr.json';
import te from '../i18n/locales/te.json';
import kn from '../i18n/locales/kn.json';
import gu from '../i18n/locales/gu.json';
import pa from '../i18n/locales/pa.json';

const resources = {
	en: { translation: en },
	hi: { translation: hi },
	bn: { translation: bn },
	mr: { translation: mr },
	te: { translation: te },
	kn: { translation: kn },
	gu: { translation: gu },
	pa: { translation: pa },
} as const;

void i18n
	.use(initReactI18next)
	.init({
		resources,
		lng: localStorage.getItem('khel_setu_language') || 'en',
		fallbackLng: 'en',
		interpolation: { escapeValue: false },
		detection: undefined,
	});

export function changeLanguage(locale: string) {
	void i18n.changeLanguage(locale);
	localStorage.setItem('khel_setu_language', locale);
}

export default i18n;
