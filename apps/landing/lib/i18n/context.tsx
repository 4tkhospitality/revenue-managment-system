'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { vi, Translations } from './vi';
import { en } from './en';

type Lang = 'vi' | 'en';

interface I18nContextType {
    t: Translations;
    lang: Lang;
    setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextType>({
    t: vi,
    lang: 'vi',
    setLang: () => { },
});

const translations: Record<Lang, Translations> = { vi, en };

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>('vi');
    const t = translations[lang];

    return (
        <I18nContext.Provider value={{ t, lang, setLang }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
