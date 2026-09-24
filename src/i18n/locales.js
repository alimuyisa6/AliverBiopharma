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
      allRightsReserved: 'All rights reserved.',
      signIn: 'Sign In', signUp: 'Sign Up',
      loading: 'Loading...', retry: 'Try again', save: 'Save', cancel: 'Cancel',
      continue: 'Continue', back: 'Back', close: 'Close', error: 'Error',
      accessRestricted: 'Access Restricted', featureUnavailable: 'Feature Unavailable',
      pageNotFound: 'Page not found', returnHome: 'Return home',
      totalXp: 'Total XP',
      dayStreak: 'Day Streak',
      badges: 'Badges',
      continuePracticing: 'Continue Practicing',
      bestRecallMastery: 'Best Recall Mastery',
      recallTopics: 'Recall Topics',
      quizBlocksDone: 'Quiz Blocks Done',
      readingStreak: 'Reading Streak',
      liveLearning: 'Live Learning',
      allLevelsTeacher: 'All Levels (Teacher Access)',
      tutorMarketplace: 'Tutor Marketplace',
      relevantLearners: 'Relevant learners',
      targetLearners: 'Target by learning level, class or programme.',
      clearCampaigns: 'Clear campaigns',
      focusedMessage: 'Present your message with a focused headline and creative.',
      responsibleAdvertising: 'Responsible advertising',
      reviewedCampaign: 'Every campaign is reviewed before it goes live.',
      advertiseEyebrow: 'Advertise with AliverBiopharm',
      advertiseHeading: 'Put your message in front of students who are paying attention.',
      advertiseDescription: 'Promote your organisation, programme or service to learners studying Biology and Pharmacy, at the moment they\\'re most open to new opportunities.'
    },
    auth: {
      loginTitle: 'Welcome back', registerTitle: 'Create your account',
      email: 'Email address', password: 'Password', confirmPassword: 'Confirm password',
      fullName: 'Full name', forgotPassword: 'Forgot your password?',
      noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
      passwordRequirements: 'Password must be at least 10 characters and meet the required complexity rules.',
      signingIn: 'Signing in...', creatingAccount: 'Creating account...'
    },
    dashboard: {
      accessRestrictedDescription: 'Your account does not have access to this area.',
      unableToLoad: 'Unable to load your dashboard right now. Please try again later.'
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
      allRightsReserved: 'Haki zote zimehifadhiwa.',
      signIn: 'Ingia', signUp: 'Jisajili', loading: 'Inapakia...', retry: 'Jaribu tena',
      save: 'Hifadhi', cancel: 'Ghairi', continue: 'Endelea', back: 'Rudi', close: 'Funga', error: 'Hitilafu',
      accessRestricted: 'Ufikiaji umezuiwa', featureUnavailable: 'Kipengele hakipatikani',
      pageNotFound: 'Ukurasa haujapatikana', returnHome: 'Rudi nyumbani',
      totalXp: 'Jumla ya XP',
      dayStreak: 'Mfululizo wa Siku',
      badges: 'Beji',
      continuePracticing: 'Endelea Kujifunza',
      bestRecallMastery: 'Umahiri Bora wa Recall',
      recallTopics: 'Mada za Recall',
      quizBlocksDone: 'Vipindi vya Quiz Vilivyokamilika',
      readingStreak: 'Mfululizo wa Kusoma',
      liveLearning: 'Mafunzo ya Moja kwa Moja',
      allLevelsTeacher: 'Ngazi Zote (Ufikiaji wa Mwalimu)',
      tutorMarketplace: 'Soko la Walimu',
      relevantLearners: 'Wanafunzi husika',
      targetLearners: 'Lenga kwa ngazi ya masomo, darasa au programu.',
      clearCampaigns: 'Kampeni zilizo wazi',
      focusedMessage: 'Wasilisha ujumbe wako kwa kichwa na ubunifu unaolenga.',
      responsibleAdvertising: 'Matangazo yenye uwajibikaji',
      reviewedCampaign: 'Kila kampeni hukaguliwa kabla ya kuchapishwa.',
      advertiseEyebrow: 'Tangaza na AliverBiopharm',
      advertiseHeading: 'Wasilisha ujumbe wako kwa wanafunzi wanaozingatia.',
      advertiseDescription: 'Tangaza shirika, programu au huduma yako kwa wanafunzi wa Biolojia na Famasia wakati wako tayari kupokea fursa mpya.'
    },
    auth: {
      loginTitle: 'Karibu tena', registerTitle: 'Fungua akaunti yako',
      email: 'Anwani ya barua pepe', password: 'Nenosiri', confirmPassword: 'Thibitisha nenosiri',
      fullName: 'Jina kamili', forgotPassword: 'Umesahau nenosiri?',
      noAccount: 'Huna akaunti?', haveAccount: 'Tayari una akaunti?',
      passwordRequirements: 'Nenosiri lazima liwe na angalau herufi 10 na likidhi masharti ya usalama.',
      signingIn: 'Inaingia...', creatingAccount: 'Inaunda akaunti...'
    },
    dashboard: {
      accessRestrictedDescription: 'Akaunti yako haina ruhusa ya kufikia eneo hili.',
      unableToLoad: 'Dashibodi yako haiwezi kupakiwa kwa sasa. Tafadhali jaribu tena baadaye.'
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
