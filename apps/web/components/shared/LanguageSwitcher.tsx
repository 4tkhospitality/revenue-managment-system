'use client';

/**
 * LanguageSwitcher — Compact inline language selector for sidebar
 *
 * UUPM redesign: replaces ugly native <select> with flag pill buttons
 * that visually integrate with the sidebar's dark theme.
 *
 * Calls PATCH /api/user/locale to persist preference,
 * then reloads the page for next-intl to pick up the new cookie.
 */
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';

const LOCALE_META: Record<SupportedLocale, { flag: string; label: string; short: string }> = {
    vi: { flag: '🇻🇳', label: 'Tiếng Việt', short: 'VI' },
    en: { flag: '🇬🇧', label: 'English', short: 'EN' },
    th: { flag: '🇹🇭', label: 'ภาษาไทย', short: 'TH' },
    id: { flag: '🇮🇩', label: 'Bahasa Indonesia', short: 'ID' },
    ms: { flag: '🇲🇾', label: 'Bahasa Melayu', short: 'MS' },
};

export function LanguageSwitcher({ className = '' }: { className?: string }) {
    const currentLocale = useLocale() as SupportedLocale;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const current = LOCALE_META[currentLocale] || LOCALE_META.en;
    const isDisabled = isPending || isUpdating;

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen]);

    const switchLocale = useCallback(async (newLocale: SupportedLocale) => {
        if (newLocale === currentLocale || isDisabled) return;

        setIsUpdating(true);
        setIsOpen(false);

        // 1. Set cookie directly (this is what middleware reads)
        document.cookie = `rms_locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;

        // 2. Best-effort: persist to DB via API (don't block on failure)
        try {
            await fetch('/api/user/locale', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: newLocale }),
            });
        } catch {
            // Cookie already set — language will switch regardless
        }

        // 3. Reload page to apply new locale
        setIsUpdating(false);
        startTransition(() => {
            router.refresh();
        });
    }, [currentLocale, isDisabled, router, startTransition]);

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger button — shows current language as a compact pill */}
            <button
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                disabled={isDisabled}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200
                    text-white/80 hover:text-white hover:bg-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Select language"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left flex items-center gap-1.5">
                    <span className="text-base leading-none">{current.flag}</span>
                    <span>{current.label}</span>
                </span>
                {/* Chevron indicator */}
                <svg
                    className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown menu — opens UPWARD since it's at the bottom of sidebar */}
            {isOpen && (
                <div
                    className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden shadow-xl border border-white/10 z-[60]"
                    style={{ backgroundColor: '#1a3570' }}
                    role="listbox"
                    aria-activedescendant={`lang-${currentLocale}`}
                >
                    {SUPPORTED_LOCALES.map((locale) => {
                        const meta = LOCALE_META[locale];
                        const isActive = locale === currentLocale;
                        return (
                            <button
                                key={locale}
                                id={`lang-${locale}`}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => switchLocale(locale)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 cursor-pointer
                                    ${isActive
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <span className="text-base leading-none w-5 text-center">{meta.flag}</span>
                                <span className="flex-1 text-left">{meta.label}</span>
                                {isActive && <Check className="w-3.5 h-3.5 text-blue-300" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
