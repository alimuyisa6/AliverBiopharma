import { useEffect, useState } from 'react';

function readVariable(name, fallback = '') {
  if (typeof window === 'undefined') return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

export default function useChartTheme() {
  const [theme, setTheme] = useState(() => ({
    series: [
      readVariable('--ch-1'),
      readVariable('--ch-2'),
      readVariable('--ch-3'),
      readVariable('--ch-4'),
      readVariable('--ch-5')
    ],
    text: readVariable('--text-secondary'),
    muted: readVariable('--text-muted'),
    main: readVariable('--text-main'),
    border: readVariable('--border-default'),
    subtleBorder: readVariable('--border-light'),
    surface: readVariable('--bg-card'),
    success: readVariable('--success'),
    danger: readVariable('--danger')
  }));

  useEffect(() => {
    const update = () => {
      setTheme({
        series: [
          readVariable('--ch-1'),
          readVariable('--ch-2'),
          readVariable('--ch-3'),
          readVariable('--ch-4'),
          readVariable('--ch-5')
        ],
        text: readVariable('--text-secondary'),
        muted: readVariable('--text-muted'),
        main: readVariable('--text-main'),
        border: readVariable('--border-default'),
        subtleBorder: readVariable('--border-light'),
        surface: readVariable('--bg-card'),
        success: readVariable('--success'),
        danger: readVariable('--danger')
      });
    };

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-color']
    });

    const bodyObserver = new MutationObserver(update);
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  return theme;
}