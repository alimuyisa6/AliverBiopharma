/* src/i18n/locales.js */

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', direction: 'ltr' }
];

export const DEFAULT_LOCALE = 'en';

export const LOCALE_MAP = Object.freeze(
  Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale.code, locale]))
);

export const TRANSLATIONS = {
  en: {
    common: {
      home: 'Home', dashboard: 'Dashboard', profile: 'Profile',
      search: 'Search', closeMenu: 'Close menu', menu: 'Menu',
      toggleTheme: 'Toggle theme', signOut: 'Sign Out', signingOut: 'Signing out...',
      quickLinks: 'Quick Links', resources: 'Resources', community: 'Community',
      privacy: 'Privacy', terms: 'Terms', about: 'About',
      footerTagline: 'Advancing biology and pharmacy education for every learner.',
      allRightsReserved: 'All rights reserved.'
    },
    profile: {
      language: 'Language', languageDescription: 'Choose the language used throughout AliverBiopharm.',
      profileOverview: 'Profile Overview', learningCurriculum: 'Learning Curriculum',
      notifications: 'Notifications', securityLogin: 'Security & Login',
      connectedDevices: 'Connected Devices', preferencesTheme: 'Preferences & Theme',
      referralProgram: 'Referral Program', parentGuardian: 'Parent / Guardian',
      billingPayments: 'Billing & Payments', certificates: 'Certificates',
      apiAccess: 'API Access', webhooks: 'Webhooks', accountData: 'Account & Data'
    }
  },
  sw: {
    common: {
      home: 'Nyumbani', dashboard: 'Dashibodi', profile: 'Wasifu',
      search: 'Tafuta', closeMenu: 'Funga menyu', menu: 'Menyu',
      toggleTheme: 'Badilisha mandhari', signOut: 'Ondoka', signingOut: 'Inaondoka...',
      quickLinks: 'Viungo vya Haraka', resources: 'Rasilimali', community: 'Jumuiya',
      privacy: 'Faragha', terms: 'Masharti', about: 'Kuhusu',
      footerTagline: 'Kuendeleza elimu ya biolojia na famasia kwa kila mwanafunzi.',
      allRightsReserved: 'Haki zote zimehifadhiwa.'
    },
    profile: {
      language: 'Lugha', languageDescription: 'Chagua lugha itakayotumika katika AliverBiopharm.',
      profileOverview: 'Muhtasari wa Wasifu', learningCurriculum: 'Mtaala wa Kujifunza',
      notifications: 'Arifa', securityLogin: 'Usalama na Kuingia',
      connectedDevices: 'Vifaa Vilivyounganishwa', preferencesTheme: 'Mapendeleo na Mandhari',
      referralProgram: 'Mpango wa Rufaa', parentGuardian: 'Mzazi / Mlezi',
      billingPayments: 'Malipo na Ankara', certificates: 'Vyeti',
      apiAccess: 'Ufikiaji wa API', webhooks: 'Webhooks', accountData: 'Akaunti na Data'
    }
  }
};

export function normalizeLocale(value) {
  if (!value) return DEFAULT_LOCALE;
  const canonical = String(value).trim().replace('_', '-').toLowerCase();
  const exact = SUPPORTED_LOCALES.find((locale) => locale.code === canonical);
  if (exact) return exact.code;
  const language = canonical.split('-')[0];
  return SUPPORTED_LOCALES.some((locale) => locale.code === language) ? language : DEFAULT_LOCALE;
}

export function getLocaleDirection(locale) {
  return LOCALE_MAP[normalizeLocale(locale)]?.direction || 'ltr';
}
