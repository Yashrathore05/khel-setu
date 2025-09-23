import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const languages = [
	{ code: 'en', label: 'EN' },
	{ code: 'hi', label: 'हिन्दी' },
	{ code: 'bn', label: 'বাংলা' },
	{ code: 'mr', label: 'मराठी' },
	{ code: 'te', label: 'తెలుగు' },
	{ code: 'kn', label: 'ಕನ್ನಡ' },
	{ code: 'gu', label: 'ગુજરાતી' },
	{ code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSwitcher() {
	const { i18n } = useTranslation();
	return (
		<div className="flex flex-wrap items-center gap-1">
			{languages.map((l) => (
				<button
					key={l.code}
					onClick={() => changeLanguage(l.code)}
					className={`rounded px-2 py-1 text-xs ${i18n.language === l.code ? 'bg-black text-white' : 'bg-gray-100'}`}
				>
					{l.label}
				</button>
			))}
		</div>
	);
}
