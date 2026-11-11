const UI_PREFERENCE_DEFAULTS = {
  font_family: 'maven',
  font_size: '100',
  density: 'comfortable',
  surface_style: 'card',
  button_size: 'medium',
  button_width: 'auto',
  content_width: 'wide',
  section_spacing: 'comfortable'
};

export const UI_PREFERENCE_MAPS = {
  font_family: {
    maven: "'Maven Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
  },
  font_size: {
    '90': '0.9',
    '100': '1',
    '110': '1.1',
    '120': '1.2'
  },
  density: {
    compact: '0.85',
    comfortable: '1',
    spacious: '1.2'
  },
  surface_style: {
    card: 'card',
    flat: 'flat'
  },
  button_size: {
    small: '0.9',
    medium: '1',
    large: '1.12'
  },
  button_width: {
    auto: 'fit-content',
    full: '100%'
  },
  content_width: {
    readable: '48rem',
    wide: '64rem',
    full: '80rem'
  },
  section_spacing: {
    compact: '0.8',
    comfortable: '1',
    spacious: '1.25'
  }
};

function normalizeUIPreferences(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    Object.entries(UI_PREFERENCE_DEFAULTS).map(([key, fallback]) => [
      key,
      Object.prototype.hasOwnProperty.call(input, key) &&
      Object.prototype.hasOwnProperty.call(
        UI_PREFERENCE_MAPS[key] || { [fallback]: true },
        String(input[key])
      )
        ? String(input[key])
        : fallback
    ])
  );
}

