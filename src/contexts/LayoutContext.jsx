 /* contexts/LayoutContext.jsx */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { bootstrapPlatform, getAllSiteSections, switchClass, updatePreferences } from '../api/cachedClient';
import { getCachedStale } from '../utils/cache';
import { UI_PREFERENCE_MAPS, normalizeUIPreferences } from '../utils/uiPreferences';

export const LayoutContext = createContext(null);

function applyUIPreferences(preferences) {
  const root = document.documentElement;
  const next = normalizeUIPreferences(preferences);

  root.style.setProperty('--ui-font-family', UI_PREFERENCE_MAPS.font_family[next.font_family]);
  root.style.setProperty('--ui-font-scale', UI_PREFERENCE_MAPS.font_size[next.font_size]);
  root.style.setProperty('--ui-density-scale', UI_PREFERENCE_MAPS.density[next.density]);
  root.style.setProperty('--ui-button-scale', UI_PREFERENCE_MAPS.button_size[next.button_size]);
  root.style.setProperty('--ui-content-max-width', UI_PREFERENCE_MAPS.content_width[next.content_width]);
  root.style.setProperty('--ui-section-scale', UI_PREFERENCE_MAPS.section_spacing[next.section_spacing]);
  root.style.setProperty('--ui-page-gutter-x', `calc(var(--page-gutter-x) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-content-gap', `calc(var(--content-gap) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-content-gap-compact', `calc(var(--content-gap-compact) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-section-space-y', `calc(var(--section-space-y) * ${UI_PREFERENCE_MAPS.section_spacing[next.section_spacing]})`);
  root.style.setProperty('--ui-section-space-y-compact', `calc(var(--section-space-y-compact) * ${UI_PREFERENCE_MAPS.section_spacing[next.section_spacing]})`);
  root.style.setProperty('--ui-card-padding-x', `calc(var(--card-padding-x) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-card-padding-y', `calc(var(--card-padding-y) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-card-padding-x-compact', `calc(var(--card-padding-x-compact) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-card-padding-y-compact', `calc(var(--card-padding-y-compact) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-card-padding-x-spacious', `calc(var(--card-padding-x-spacious) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.style.setProperty('--ui-card-padding-y-spacious', `calc(var(--card-padding-y-spacious) * ${UI_PREFERENCE_MAPS.density[next.density]})`);
  root.setAttribute('data-ui-surface', next.surface_style);
  root.setAttribute('data-ui-density', next.density);
  root.setAttribute('data-ui-button-size', next.button_size);
  root.style.setProperty('--ui-button-width', UI_PREFERENCE_MAPS.button_width[next.button_width]);
  root.setAttribute('data-ui-button-width', next.button_width);
  root.setAttribute('data-ui-content-width', next.content_width);
  root.setAttribute('data-ui-section-spacing', next.section_spacing);
  return next;
}


export function LayoutProvider({ children }) {
  const { user, loading: authLoading, refresh } = useAuth();

  const effectiveLevel = user?.profile?.active_level_id || user?.profile?.track || null;
  const activeGroupId = user?.profile?.active_group_id || null;

  const [bootstrap, setBootstrap] = useState(() => {
    if (!effectiveLevel) return null;
    return getCachedStale(`bootstrap_${effectiveLevel}`);
  });

  const [loading, setLoading] = useState(() => {
    if (!effectiveLevel) return false;
    return !getCachedStale(`bootstrap_${effectiveLevel}`);
  });

  const [switching, setSwitching] = useState(false);
  const [theme, setTheme] = useState('light');
  const accessibility = user?.profile?.accessibility || {};
  const uiPreferences = normalizeUIPreferences(user?.profile?.preferences?.ui || {});
  const [sections, setSections] = useState(() => getCachedStale('site_sections') || {});


  useEffect(() => {
    if (!user?.profile?.preferences?.theme_mode) return;

    const savedTheme = user.profile.preferences.theme_mode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, [user?.profile?.preferences?.theme_mode]);

  useEffect(() => {
    applyUIPreferences(uiPreferences);
  }, [uiPreferences]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    document.body.classList.toggle('accessibility-large-text', !!accessibility.large_text);
    document.body.classList.toggle('accessibility-high-contrast', !!accessibility.high_contrast);
    document.body.classList.toggle('accessibility-reduce-motion', !!accessibility.reduce_motion);
    document.body.classList.toggle('accessibility-dyslexia-font', !!accessibility.dyslexia_font);
  }, [theme, accessibility]);

  useEffect(() => {
    if (!effectiveLevel) {
      setBootstrap(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const cachedBootstrap = getCachedStale(`bootstrap_${effectiveLevel}`);
    const cachedSections = getCachedStale('site_sections');

    if (cachedBootstrap) {
      setBootstrap(cachedBootstrap);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (cachedSections) setSections(cachedSections);

    bootstrapPlatform(effectiveLevel)
      .then((result) => {
        if (cancelled) return;
        setBootstrap(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    getAllSiteSections()
      .then((result) => {
        if (cancelled) return;
        setSections(result || {});
      })
      .catch(() => {
        // Site sections are supplemental; keep cached/empty sections on failure.
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveLevel]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);

      if (user) {
        updatePreferences({
          preferences: {
            ...(user.profile?.preferences || {}),
            theme_mode: next
          }
        }).catch((error) => {
          console.error('[THEME_PREFERENCE_ERROR]', error?.message || 'Failed to save theme preference');
        });
      }

      return next;
    });
  }, [user]);

  const handleSwitchClass = useCallback(async (groupId) => {
    setSwitching(true);

    try {
      await switchClass(groupId);
      await refresh();
    } catch (error) {
      console.error('[SWITCH_CLASS_ERROR]', error?.message || 'Failed to switch class');
      throw new Error('We could not update your class. Please try again.');
    } finally {
      setSwitching(false);
    }
  }, [refresh]);

  const value = useMemo(() => {
    const platformConfig = bootstrap?.platform || null;

    const safeFeatures = {};
    const safeFeatureKeys = [
      'recall',
      'videos',
      'quizzes',
      'articles',
      'glossary',
      'community',
      'donations',
      'classrooms',
      'flashcards',
      'past_papers',
      'lab_simulations'
    ];

    for (const key of safeFeatureKeys) {
      safeFeatures[key] = platformConfig?.features_enabled?.[key] ?? true;
    }

    const uiComponents = bootstrap?.ui_components || [];
    const uiMap = {};

    for (const component of uiComponents) {
      if (component?.component_key) {
        const { properties = {}, component_type = null } = component;
        const safeProperties = {};

        for (const key of Object.keys(properties)) {
          if (['icon', 'label', 'color', 'variant', 'size'].includes(key)) {
            safeProperties[key] = properties[key];
          }
        }

        uiMap[component.component_key] = {
          ...safeProperties,
          component_type
        };
      }
    }

    const baseNav = bootstrap?.header?.nav_items || [];

    const mergedNavigation = [
      ...baseNav,
      ...(platformConfig?.primary_nav || []).map((item, index) => ({
        label: item?.label || '',
        href: item?.href || '',
        icon: item?.icon || null,
        auth_required: item?.auth_required ?? false,
        position: baseNav.length + index
      })),
      ...(platformConfig?.secondary_nav || []).map((item, index) => ({
        label: item?.label || '',
        href: item?.href || '',
        icon: item?.icon || null,
        auth_required: item?.auth_required ?? false,
        position: baseNav.length + (platformConfig?.primary_nav?.length || 0) + index
      }))
    ].sort((a, b) => (a.position || 0) - (b.position || 0));

    if (!bootstrap) {
      return {
        loading,
        bootstrap: null,
        logo: null,
        siteName: 'AliverBiopharm',
        navigation: [],
        footer: { quick_links: [], resource_links: [], community_links: [], social_links: {} },
        groups: [],
        switchGroups: [],
        level: null,
        user,
        isAuthenticated: !!user,
        colorTheme: {},
        theme,
        toggleTheme,
        authLoading,
        refreshUser: refresh,
        switchClass: handleSwitchClass,
        switching,
        activeGroupId,
        sections,
        features: safeFeatures,
        uiMap: {},
        uiPreferences,
        platform: null
      };
    }

    return {
      loading: false,
      bootstrap,
      logo: bootstrap.universal?.logo_url || null,
      siteName: 'AliverBiopharm',
      navigation: mergedNavigation,
      footer: bootstrap.footer || { quick_links: [], resource_links: [], community_links: [], social_links: {} },
      groups: bootstrap.groups || [],
      switchGroups: bootstrap.switch_groups || bootstrap.groups || [],
      level: bootstrap.level,
      user,
      isAuthenticated: !!user,
      colorTheme: bootstrap.theme || {},
      theme,
      toggleTheme,
      authLoading,
      refreshUser: refresh,
      switchClass: handleSwitchClass,
      switching,
      activeGroupId,
      sections,
      features: safeFeatures,
      uiMap,
      uiPreferences,
      platform: platformConfig
    };
  }, [
    bootstrap,
    authLoading,
    user,
    theme,
    toggleTheme,
    refresh,
    handleSwitchClass,
    switching,
    activeGroupId,
    sections,
    uiPreferences
  ]);

  return (
    <LayoutContext.Provider value={value}>
      {children}

    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);

  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');

  return ctx;
}
