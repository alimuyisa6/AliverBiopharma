import { useEffect, useState } from 'react';

function readVariable(name) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function readTheme() {
  return {
    series: ['--ch-1', '--ch-2', '--ch-3', '--ch-4', '--ch-5'].map(readVariable),
    text: readVariable('--text-secondary'),
    muted: readVariable('--text-muted'),
    main: readVariable('--text-main'),
    border: readVariable('--border-default'),
    subtleBorder: readVariable('--border-light'),
    surface: readVariable('--bg-card'),
    success: readVariable('--success'),
    danger: readVariable('--danger')
  };
}

export default function useChartTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const update = () => setTheme(readTheme());

    const htmlObserver = new MutationObserver(update);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-color']
    });

    const bodyObserver = new MutationObserver(update);
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      htmlObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  return theme;
}
