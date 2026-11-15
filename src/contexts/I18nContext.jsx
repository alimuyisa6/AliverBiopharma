/* src/contexts/I18nContext.jsx */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { updatePreferences } from '../api/client';
import { DEFAULT_LOCALE, LOCALE_MAP, SUPPORTED_LOCALES, TRANSLATIONS, getLocaleDirection, normalizeLocale } from '../i18n/locales';

const I18nContext = createContext(null);

function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if (normalized !== DEFAULT_LOCALE || String(candidate).toLowerCase().startsWith('en')) return normalized;
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const savedLocale = user?.profile?.language;
  const [locale, setLocaleState] = useState(() => normalizeLocale(savedLocale || detectBrowserLocale()));

  useEffect(() => {
    if (savedLocale) setLocaleState(normalizeLocale(savedLocale));
  }, [savedLocale]);

  useEffect(() => {
    const normalized = normalizeLocale(locale);
    const direction = getLocaleDirection(normalized);
    document.documentElement.lang = normalized;
    document.documentElement.dir = direction;
  }, [locale]);

  const setLocale = useCallback(async (nextLocale, { persist = true } = {}) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    if (persist && user) {
      await updatePreferences({ language: normalized });
    }
    return normalized;
  }, [user]);

  const t = useCallback((key, fallback = key) => {
    const value = key.split('.').reduce((current, part) => current?.[part], TRANSLATIONS[locale]);
    if (typeof value === 'string') return value;
    const fallbackValue = key.split('.').reduce((current, part) => current?.[part], TRANSLATIONS[DEFAULT_LOCALE]);
    return typeof fallbackValue === 'string' ? fallbackValue : fallback;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    direction: getLocaleDirection(locale),
    locales: SUPPORTED_LOCALES,
    localeMap: LOCALE_MAP,
    setLocale,
    t
  }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
