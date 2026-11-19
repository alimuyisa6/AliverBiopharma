 import { memo } from 'react';

const ICON_DATA = {
  'arrow-left': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M16 12H8M12 8l-4 4 4 4\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'arrow-right': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'arrow-up': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M12 16V8M8 12l4-4 4 4\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'atom': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<ellipse cx=\"12\" cy=\"12\" rx=\"8\" ry=\"3\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\"/><ellipse cx=\"12\" cy=\"12\" rx=\"8\" ry=\"3\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\" transform=\"rotate(60 12 12)\"/><ellipse cx=\"12\" cy=\"12\" rx=\"8\" ry=\"3\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\" transform=\"rotate(120 12 12)\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\" fill=\"var(--white)\"/>" },

  'bars': {
    badge: 'rect',
    bg: 'var(--primary)',
    r: 4,
    bgPath: "",
    glyph: "<path d=\"M6 8h12M6 12h12M6 16h12\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\"/>"
  },

  'bell': { badge: 'none', bg: 'var(--success-color)', r: 2, bgPath: "<rect x=\"3\" y=\"2\" width=\"18\" height=\"20\" rx=\"2\" stroke=\"var(--success-color)\" stroke-width=\"2\" fill=\"none\"/>", glyph: "<path d=\"M7 7h10\" stroke=\"var(--success-color)\" stroke-width=\"2\"/><path d=\"M7 11h10\" stroke=\"var(--success-color)\" stroke-width=\"2\"/><path d=\"M7 15h6\" stroke=\"var(--success-color)\" stroke-width=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"3\" fill=\"var(--success-color)\"/>" },
  'book-open': { badge: 'rect', bg: 'var(--secondary)', r: 2, bgPath: "", glyph: "<path d=\"M8 8h8M8 12h8M8 16h5\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\"/>" },
  'book-open-reader': { badge: 'rect', bg: 'var(--secondary)', r: 2, bgPath: "", glyph: '<circle cx="12" cy="6" r="2.4" fill="var(--white)"/><path d="M5 20v-2.5a4.5 4.5 0 0 1 4.5-4.5h5a4.5 4.5 0 0 1 4.5 4.5V20M4 8l8 3 8-3v9l-8 3-8-3zM12 11v9" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>' },
  'bookmark': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M6 3.5A1.5 1.5 0 017.5 2h9A1.5 1.5 0 0118 3.5V22l-6-4-6 4V3.5z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/>" },
  'brain': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M9 6c-2.2 0-4 1.8-4 4 0 .7.2 1.4.5 2-.5.6-.8 1.4-.8 2.3 0 2 1.6 3.7 3.7 3.7h.6M15 6c2.2 0 4 1.8 4 4 0 .7-.2 1.4-.5 2 .5.6.8 1.4.8 2.3 0 2-1.6 3.7-3.7 3.7h-.6M9 6v12M15 6v12\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'bullhorn': { badge: 'rect', bg: 'var(--accent-dark)', r: 4, bgPath: "", glyph: "<path d=\"M5 10v4l3 1v3l3-1v-3l7 3V6L8 9H5z\" stroke=\"var(--white)\" stroke-width=\"1.4\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'calendar': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<rect x="3" y="4" width="18" height="17" rx="2" stroke="var(--white)" stroke-width="1.6" fill="none"/><path d="M7 2v4M17 2v4M3 9h18" stroke="var(--white)" stroke-width="1.6" stroke-linecap="round"/><rect x="6" y="12" width="3" height="3" fill="var(--white)"/><rect x="11" y="12" width="3" height="3" fill="var(--white)"/><rect x="16" y="12" width="2" height="3" fill="var(--white)"/>' },
  'camera': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"M5 8h3l1.5-2h5L16 8h3a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"12\" cy=\"13\" r=\"3\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/>" },
  'capsules': { badge: 'circle', bg: 'var(--success-color)', r: 0, bgPath: "", glyph: "<rect x=\"4\" y=\"10\" width=\"9\" height=\"5.5\" rx=\"2.75\" fill=\"var(--white)\" transform=\"rotate(-30 8.5 12.75)\"/><rect x=\"11\" y=\"8.5\" width=\"9\" height=\"5.5\" rx=\"2.75\" stroke=\"var(--white)\" stroke-width=\"1.4\" fill=\"none\" transform=\"rotate(-30 15.5 11.25)\"/>" },
  'chart-pie': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M12 3v9h9A9 9 0 1012 3z\" fill=\"none\" stroke=\"var(--white)\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"M15 3.5A8.5 8.5 0 0120.5 9H15V3.5z\" fill=\"var(--white)\"/>" },
  'calendar-clock': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M8 3v4M16 3v4M4 9h16\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><circle cx=\"15.5\" cy=\"15\" r=\"3\" fill=\"var(--primary)\" stroke=\"var(--white)\" stroke-width=\"1.2\"/><path d=\"M15.5 13.5v1.7l1.1.7\" stroke=\"var(--white)\" stroke-width=\"1.1\" stroke-linecap=\"round\"/>" },
  'chart-line': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<rect x=\"2\" y=\"12\" width=\"4\" height=\"8\" rx=\"1\" fill=\"var(--success-color)\"/><rect x=\"8\" y=\"8\" width=\"4\" height=\"12\" rx=\"1\" fill=\"var(--success-color)\"/><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" fill=\"var(--primary)\"/><rect x=\"20\" y=\"10\" width=\"4\" height=\"10\" rx=\"1\" fill=\"var(--secondary)\"/>" },
  'check': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"m6.5 12.5 3.5 3.5 7.5-8\" stroke=\"var(--white)\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'check-double': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"m4.5 12.5 3.2 3.2 6.8-7.2M11.5 15.7l1.7 1.7 6.3-6.7\" stroke=\"var(--white)\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'chevron-down': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M8 10l4 4 4-4\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'chevron-left': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M14 8l-4 4 4 4\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'chevron-right': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M10 8l4 4-4 4\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'circle': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"var(--primary)\"/>" },
  'circle-check': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"m7 12.5 3.2 3.2L17.5 8\" stroke=\"var(--white)\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'circle-info': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"7\" r=\"1.2\" fill=\"var(--white)\"/><path d=\"M12 11v6\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\"/>" },
  'circle-xmark': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<path d=\"m8 8 8 8M16 8l-8 8\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\"/>" },
  'clipboard-check': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<rect x=\"7\" y=\"5\" width=\"10\" height=\"16\" rx=\"1.5\" fill=\"none\" stroke=\"var(--white)\" stroke-width=\"1.5\"/><path d=\"M9 4h6v3H9zM9 12l2 2 4-4\" fill=\"none\" stroke=\"var(--white)\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'clock': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"7.5\" stroke=\"var(--white)\" stroke-width=\"1.7\" fill=\"none\"/><path d=\"M12 7.5v4.8l3.2 2\" stroke=\"var(--white)\" stroke-width=\"1.7\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'wrench': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M14.5 6.5a4.5 4.5 0 00-5.8 5.8L4 17l3 3 4.7-4.7a4.5 4.5 0 005.8-5.8l-2.7 2.7-3-3 2.7-2.7z\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'wifi-slash': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<path d=\"M3 8a14 14 0 0115-2M21 8a14 14 0 00-2-1.5M8.5 12a7 7 0 017.5-.5M12 16a2 2 0 012 0M3 3l18 18\" stroke=\"var(--white)\" stroke-width=\"1.7\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'comment': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z\" fill=\"var(--success-color)\"/><circle cx=\"8\" cy=\"10\" r=\"1.5\" fill=\"var(--white)\"/><circle cx=\"12\" cy=\"10\" r=\"1.5\" fill=\"var(--white)\"/><circle cx=\"16\" cy=\"10\" r=\"1.5\" fill=\"var(--white)\"/>" },
  'credit-card': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<rect x=\"4\" y=\"9\" width=\"16\" height=\"2.2\" fill=\"var(--white)\"/><rect x=\"4\" y=\"14\" width=\"6\" height=\"1.6\" rx=\"0.8\" fill=\"var(--white)\"/>" },
  'bitcoin': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: '', glyph: '<path d="M9 5h5.5a3 3 0 0 1 0 6H9m0 0h6a3.2 3.2 0 0 1 0 6.4H9M11 3v18m3-18v2m0 14v2M7 7h10M7 17h10" stroke="var(--white)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
  'mobile-money': { badge: 'rect', bg: 'var(--success-color)', r: 5, bgPath: '', glyph: '<rect x="7" y="3" width="10" height="18" rx="2" stroke="var(--white)" stroke-width="1.7" fill="none"/><path d="M10 6h4m-4 10h4" stroke="var(--white)" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="18.5" r=".6" fill="var(--white)"/>' },
  'crown': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M3 8l5 4 4-8 4 8 5-4-2 11H5L3 8z\" fill=\"var(--accent-dark)\"/><circle cx=\"8\" cy=\"6\" r=\"1.2\" fill=\"var(--accent-dark)\"/><circle cx=\"16\" cy=\"6\" r=\"1.2\" fill=\"var(--accent-dark)\"/>" },
  'discord': { badge: 'rect', bg: 'var(--primary)', r: 6, bgPath: "", glyph: "<circle cx=\"9\" cy=\"13\" r=\"1.6\" fill=\"var(--white)\"/><circle cx=\"15\" cy=\"13\" r=\"1.6\" fill=\"var(--white)\"/><path d=\"M8 8.5C10.5 7.5 13.5 7.5 16 8.5\" stroke=\"var(--white)\" stroke-width=\"1.4\" fill=\"none\" stroke-linecap=\"round\"/>" },
  'door-closed': { badge: 'rect', bg: 'var(--secondary)', r: 4, bgPath: "", glyph: "<rect x=\"8\" y=\"4\" width=\"8\" height=\"16\" rx=\"1\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"13.3\" cy=\"12\" r=\"0.9\" fill=\"var(--white)\"/>" },
  'door-open': { badge: 'rect', bg: 'var(--success-color)', r: 4, bgPath: "", glyph: "<path d=\"M9 4h6v16H9z\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M9 4L4 6v14l5-1\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\" stroke-linejoin=\"round\"/><circle cx=\"7\" cy=\"12\" r=\"0.8\" fill=\"var(--white)\"/>" },
  'download': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M12 4v10M8 10l4 4 4-4M6 18h12\" stroke=\"var(--white)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" },
  'ellipsis': { badge: 'rect', bg: 'var(--primary)', r: 12, bgPath: "", glyph: "<circle cx=\"7\" cy=\"12\" r=\"1.6\" fill=\"var(--white)\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"var(--white)\"/><circle cx=\"17\" cy=\"12\" r=\"1.6\" fill=\"var(--white)\"/>" },
  'envelope': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--white)" stroke-width="1.6" fill="none"/><path d="m4 7 8 6 8-6" stroke="var(--white)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
  'envelope-circle-check': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M3 7h18v12H3z\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"m3 8 9 7 9-7\" stroke=\"currentColor\" stroke-width=\"1.6\" fill=\"none\"/>" },
  'exclamation-triangle': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 3L2 20h20L12 3z\" fill=\"var(--accent-dark)\"/><rect x=\"11\" y=\"10\" width=\"2\" height=\"5\" rx=\"1\" fill=\"var(--white)\"/><circle cx=\"12\" cy=\"17\" r=\"1.1\" fill=\"var(--white)\"/>" },
  'eye': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\" fill=\"var(--white)\"/>" },
  'eye-slash': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\" fill=\"var(--white)\"/><line x1=\"4\" y1=\"20\" x2=\"20\" y2=\"4\" stroke=\"var(--white)\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>" },
  'face-smile': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<circle cx=\"9\" cy=\"10.5\" r=\"1.3\" fill=\"var(--white)\"/><circle cx=\"15\" cy=\"10.5\" r=\"1.3\" fill=\"var(--white)\"/><path d=\"M8 14.5c1 1.4 2.5 2.2 4 2.2s3-.8 4-2.2\" stroke=\"var(--white)\" stroke-width=\"1.8\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'facebook': { badge: 'rect', bg: 'var(--primary)', r: 6, bgPath: "", glyph: "<path d=\"M14 8.5h1.6V5.8h-1.9c-2.1 0-3.2 1.3-3.2 3.4v1.6H8.4v2.8h2.1V19h2.8v-5.4h2l.4-2.8h-2.4V9.4c0-.6.2-.9.9-.9z\" fill=\"var(--white)\"/>" },
  'file-contract': { badge: 'rect', bg: 'var(--danger-color)', r: 4, bgPath: "", glyph: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 15h4" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="m9 18 1.3 1.2L13 16.5" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
  'file-lines': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"M7 3.5h7l4 4V20H7zM14 3.5V8h4M9.5 12h6M9.5 15.5h6\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'file-pdf': { badge: 'rect', bg: 'var(--danger-color)', r: 4, bgPath: "", glyph: '<path d="M6 3h8l4 4v14H6zM14 3v5h4" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linejoin="round"/><text x="7" y="16" font-size="5.8" font-weight="800" fill="var(--white)">PDF</text>' },
  'filter': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"M5 6h14l-5 6.5V18l-4 2v-7.5z\" fill=\"var(--white)\"/>" },
  'fire': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 2c1 3-3 4-3 8a3 3 0 006 0c1 1 2 2.5 2 4.2A6.8 6.8 0 019 20a7 7 0 01-3-13c1.2 2 2 2.5 2 2.5C7 6 9.5 3 12 2z\" fill=\"var(--accent-dark)\"/>" },
  'flag': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M6 21V4m0 0c4-3 7 3 12 0v10c-5 3-8-3-12 0\" stroke=\"currentColor\" stroke-width=\"1.7\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'flag-checkered': { badge: 'none', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<path d="M5 21V3" stroke="var(--white)" stroke-width="2" stroke-linecap="round"/><path d="M5 4h14v10H5z" fill="none" stroke="var(--white)" stroke-width="1.5"/><path d="M5 4h5v5H5zm10 5h4v5h-4zM10 9h5v5h-5z" fill="var(--white)"/>' },
  'flask': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M10 4h4M10 4v5l-4.5 8A2 2 0 007.2 20h9.6a2 2 0 001.7-3l-4.5-8V4\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M8.5 15h7\" stroke=\"var(--white)\" stroke-width=\"1.4\"/>" },
  'gauge-high': { badge: 'none', bg: 'var(--primary)', r: 7, bgPath: "<rect x=\"1\" y=\"5\" width=\"22\" height=\"14\" rx=\"7\" fill=\"var(--primary)\"/>", glyph: "<circle cx=\"16\" cy=\"12\" r=\"4\" fill=\"var(--white)\"/>" },
  'gear': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"3\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M12 5v2M12 17v2M5 12h2M17 12h2M7.5 7.5l1.4 1.4M15.1 15.1l1.4 1.4M16.5 7.5l-1.4 1.4M8.9 15.1l-1.4 1.4\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>" },
  'globe': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"var(--primary)\" stroke-width=\"2\" fill=\"none\"/><ellipse cx=\"12\" cy=\"12\" rx=\"4\" ry=\"10\" stroke=\"var(--primary)\" stroke-width=\"2\" fill=\"none\"/><path d=\"M2 12h20\" stroke=\"var(--primary)\" stroke-width=\"2\"/>" },
  'graduation-cap': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"M12 6L4 9.5 12 13l8-3.5L12 6z\" fill=\"var(--white)\"/><path d=\"M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5\" stroke=\"var(--white)\" stroke-width=\"1.4\" fill=\"none\"/><line x1=\"19\" y1=\"9.5\" x2=\"19\" y2=\"14.5\" stroke=\"var(--white)\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>" },
  'hand': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<path d=\"M9 13V6a1.2 1.2 0 012.4 0v5M11.4 11V5a1.2 1.2 0 012.4 0v6M13.8 11.5V6.5a1.2 1.2 0 012.4 0V13M9 12.5v3.5a5 5 0 005 5h.5a5 5 0 005-5v-4\" stroke=\"var(--white)\" stroke-width=\"1.3\" fill=\"none\" stroke-linecap=\"round\"/>" },
  'hand-holding-heart': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<path d="M3 14h5l2 2h4a2 2 0 0 0 2h-6l-3-2H3zM8 13l3 2h4a2 2 0 0 1 0 3H9l-4-3" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M16 3c-1.5 0-2.5 1-2.5 2.4C13.5 7 16 9 16 9s2.5-2 2.5-3.6C18.5 4 17.5 3 16 3z" fill="var(--white)"/>' },
  'headset': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2zM17 19a5 5 0 0 1-5 3h-2" stroke="var(--white)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
  'heart': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<path d="M12 21S3 15.4 3 9.3C3 5.3 7.8 3.3 12 7c4.2-3.7 9-1.7 9 2.3 0 6.1-9 11.7-9 11.7z" fill="var(--white)"/>' },
  'home': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 3l9 8h-2.5v9h-4.5v-6h-4v6h-4.5v-9H3l9-8z\" fill=\"var(--primary)\"/>" },
  'id-card': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="var(--white)" stroke-width="1.6" fill="none"/><circle cx="8" cy="10" r="2" fill="var(--white)"/><path d="M5.5 15a2.5 2.5 0 0 1 5 0M13 9h5M13 12h5M13 15h4" stroke="var(--white)" stroke-width="1.4" stroke-linecap="round" fill="none"/>' },
  'image': { badge: 'rect', bg: 'var(--secondary)', r: 4, bgPath: "", glyph: "<rect x=\"5\" y=\"6\" width=\"14\" height=\"12\" rx=\"1.5\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"9\" cy=\"10.5\" r=\"1.3\" fill=\"var(--white)\"/><path d=\"M6 17l4.5-4.5 3 3 2.5-2.5 4 4\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\" stroke-linejoin=\"round\"/>" },
  'instagram': { badge: 'rect', bg: 'var(--secondary)', r: 7, bgPath: "", glyph: "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"4\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"3\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"16.2\" cy=\"7.8\" r=\"1\" fill=\"var(--white)\"/>" },
  'key': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<circle cx=\"8\" cy=\"12\" r=\"3\" stroke=\"var(--primary)\" stroke-width=\"1.8\" fill=\"none\"/><path d=\"M10.8 12h9.2M17 12v2.5M14.3 12v2\" stroke=\"var(--primary)\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>" },
  'keyboard': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<rect x=\"4\" y=\"8\" width=\"16\" height=\"9\" rx=\"1.5\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M7 11.5h.01M10 11.5h.01M13 11.5h.01M16 11.5h.01M8 14.5h8\" stroke=\"var(--white)\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>" },
  'layer-group': { badge: 'rect', bg: 'var(--secondary)', r: 2, bgPath: "", glyph: '<path d="m3 8 9-5 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linejoin="round"/>' },
  'lightbulb': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<path d=\"M9 15a5 5 0 116 0c-.6.6-1 1.4-1 2.2V18h-4v-.8c0-.8-.4-1.6-1-2.2z\" stroke=\"var(--primary)\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M10 20.5h4\" stroke=\"var(--primary)\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>" },
  'link': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M10 14l4-4M9 15.5L7 17.5a3 3 0 01-4.2-4.2L5 11M15 8.5L17 6.5a3 3 0 014.2 4.2L19 13\" stroke=\"var(--white)\" stroke-width=\"1.8\" fill=\"none\" stroke-linecap=\"round\"/>" },
  'linkedin': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<circle cx=\"7.5\" cy=\"7.5\" r=\"1.6\" fill=\"var(--white)\"/><rect x=\"6\" y=\"10.5\" width=\"3\" height=\"7.5\" fill=\"var(--white)\"/><path d=\"M11.5 10.5h3v1.3c.6-.9 1.6-1.5 3-1.5 2.3 0 3.5 1.5 3.5 4.2v5.5h-3v-5c0-1.3-.5-2-1.6-2s-1.9.8-1.9 2.1v4.9h-3v-9.5z\" fill=\"var(--white)\"/>" },
  'list-check': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"m4.5 7 1.2 1.2L7.8 6M10 7h9M4.5 12l1.2 1.2L7.8 11M10 12h9M4.5 17l1.2 1.2L7.8 16M10 17h9\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'location-dot': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z\" fill=\"var(--danger-color)\"/><circle cx=\"12\" cy=\"9\" r=\"2.5\" fill=\"var(--white)\"/>" },
  'lock': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<rect x=\"7.5\" y=\"11\" width=\"9\" height=\"7\" rx=\"1.5\" fill=\"var(--white)\"/><path d=\"M9 11V8.5a3 3 0 016 0V11\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/>" },

  'magnifying-glass': {
    badge: 'circle',
    bg: 'var(--primary)',
    r: 0,
    bgPath: "",
    glyph: '<circle cx="10" cy="10" r="6" stroke="var(--white)" stroke-width="1.8" fill="none"/><path d="m15 15 5 5" stroke="var(--white)" stroke-width="2" stroke-linecap="round"/><path d="M7.5 10h5M10 7.5v5" stroke="var(--white)" stroke-width="1.4" stroke-linecap="round"/>'
  },

  'medal': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="12" cy="10" r="5.5" stroke="var(--white)" stroke-width="1.6" fill="none"/><path d="m8 14-2 8 6-3 6 3-2-8M10 7l2 1 2-1v3l-2 2-2-2z" stroke="var(--white)" stroke-width="1.4" fill="none" stroke-linejoin="round"/>' },
  'message': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5z" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="8" cy="12" r="1" fill="var(--white)"/><circle cx="12" cy="12" r="1" fill="var(--white)"/><circle cx="16" cy="12" r="1" fill="var(--white)"/>' },
  'microphone': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<rect x=\"9.5\" y=\"4\" width=\"5\" height=\"9\" rx=\"2.5\" fill=\"var(--white)\"/><path d=\"M7 11a5 5 0 0010 0M12 16v3M9.5 20h5\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'microphone-slash': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<rect x=\"9.5\" y=\"4\" width=\"5\" height=\"9\" rx=\"2.5\" fill=\"var(--white)\"/><path d=\"M7 11a5 5 0 0010 0M12 16v3M9.5 20h5\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\" fill=\"none\"/><line x1=\"4\" y1=\"20\" x2=\"20\" y2=\"4\" stroke=\"var(--white)\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>" },
  'microscope': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M10 4l4 4M9 15h6M12 15V9M9 9h4l3 4\" stroke=\"var(--white)\" stroke-width=\"1.5\" stroke-linecap=\"round\" fill=\"none\"/><rect x=\"6\" y=\"18\" width=\"12\" height=\"2\" rx=\"1\" fill=\"var(--white)\"/>" },

  'moon': {
    badge: 'none',
    bg: '',
    r: 0,
    bgPath: "",
    glyph: "<path d=\"M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z\" fill=\"var(--primary)\"/>"
  },

  'paper-plane': { badge: 'none', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<path d="m3 11 18-8-6 18-3-7-9-3z" fill="none" stroke="var(--white)" stroke-width="1.7" stroke-linejoin="round"/><path d="m12 14 9-11-12 8" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>' },
  'pen-to-square': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<path d=\"M15 6l3 3-8 8H7v-3l8-8z\" fill=\"var(--white)\"/><path d=\"M6 18h12\" stroke=\"var(--white)\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>" },
  'pinterest': { badge: 'rect', bg: 'var(--danger-color)', r: 7, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"7\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M10 18l2-9c-.6-.3-1-1-1-1.8 0-1.3 1-2.3 2.2-2.3 1 0 1.6.7 1.6 1.6 0 1-.6 2.4-1 3.7-.3 1.1.5 2 1.6 2 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.4-4.9-4.4\" stroke=\"var(--white)\" stroke-width=\"1.3\" fill=\"none\"/>" },
  'play': { badge: 'circle', bg: 'var(--success-color)', r: 0, bgPath: "", glyph: "<path d=\"M9 7l9 5-9 5V7z\" fill=\"var(--white)\"/>" },
  'plus': { badge: 'circle', bg: 'var(--success-color)', r: 0, bgPath: "", glyph: "<path d=\"M12 7v10M7 12h10\" stroke=\"var(--white)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>" },
  'reddit': { badge: 'rect', bg: 'var(--accent-dark)', r: 7, bgPath: "", glyph: "<ellipse cx=\"12\" cy=\"14\" rx=\"7\" ry=\"5\" stroke=\"var(--white)\" stroke-width=\"1.4\" fill=\"none\"/><circle cx=\"9\" cy=\"14\" r=\"1\" fill=\"var(--white)\"/><circle cx=\"15\" cy=\"14\" r=\"1\" fill=\"var(--white)\"/><path d=\"M9.5 16.5c1.5 1 3.5 1 5 0\" stroke=\"var(--white)\" stroke-width=\"1.3\" stroke-linecap=\"round\" fill=\"none\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"5.5\" stroke=\"var(--white)\" stroke-width=\"1.3\"/><circle cx=\"12\" cy=\"5\" r=\"1.2\" fill=\"var(--white)\"/>" },
  'right-from-bracket': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<path d=\"M9 4H6a1 1 0 00-1 1v14a1 1 0 001 1h3M15 12h6m0 0l-3-3m3 3l-3 3\" stroke=\"var(--white)\" stroke-width=\"1.8\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'right-to-bracket': { badge: 'circle', bg: 'var(--success-color)', r: 0, bgPath: "", glyph: "<path d=\"M15 4h3a1 1 0 011 1v14a1 1 0 01-1 1h-3M4 12h11m0 0l-3-3m3 3l-3 3\" stroke=\"var(--white)\" stroke-width=\"1.8\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'rocket': { badge: 'none', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<path d="M14 4c3-2 6-2 7-2 0 1 0 4-2 7l-6 6-5-5 6-6z" stroke="var(--white)" stroke-width="1.5" fill="none"/><path d="m8 10-4 1-2 4 5-1m5 1-1 4 4 2 1-5M9 16l-4 4" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/><circle cx="17" cy="6" r="1.5" fill="var(--white)"/>' },
  'rotate': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<path d=\"M17 8a6.5 6.5 0 10.9 6.5\" stroke=\"var(--white)\" stroke-width=\"1.8\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M17 4.5V8h-3.5\" stroke=\"var(--white)\" stroke-width=\"1.8\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" },
  'route': { badge: 'none', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<path d="M5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM19 14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="var(--white)" stroke-width="1.6" fill="none"/><path d="M7.5 7.5h4a3 3 0 0 1 3 3v3.5a2.5 2.5 0 0 0 2.5 2.5H17" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' },
  'screwdriver-wrench': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M14 4l-3 3 6 6 3-3a4 4 0 01-6-6z\" fill=\"var(--white)\"/><path d=\"M11 10L5 16v3h3l6-6\" fill=\"var(--white)\"/>" },

  'search': {
    badge: 'circle',
    bg: 'var(--primary)',
    r: 0,
    bgPath: "",
    glyph: '<circle cx="10" cy="10" r="5.5" stroke="var(--white)" stroke-width="1.8" fill="none"/><path d="m14.5 14.5 5 5" stroke="var(--white)" stroke-width="2" stroke-linecap="round"/><path d="M8 8c1.2-1.2 2.8-1.2 4 0" stroke="var(--white)" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
  },

  'seedling': { badge: 'circle', bg: 'var(--success-color)', r: 0, bgPath: "", glyph: "<path d=\"M12 20v-6M12 14c0-4 3-6 6-6 0 4-3 6-6 6zM12 14c0-3-2.5-5-5.5-5 0 3.5 2.5 5.5 5.5 5.5z\" fill=\"var(--white)\"/>" },
  'share': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<circle cx=\"18\" cy=\"6\" r=\"2.2\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"6\" cy=\"12\" r=\"2.2\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><circle cx=\"18\" cy=\"18\" r=\"2.2\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\"/><path d=\"M8 10.8l8-3.6M8 13.2l8 3.6\" stroke=\"var(--white)\" stroke-width=\"1.4\"/>" },
  'shield-halved': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z\" fill=\"var(--primary)\"/><path d=\"M12 2v20c-4.5-2.5-8-6-8-11V5l8-3z\" fill=\"var(--primary)\"/>" },
  'spell-check': { badge: 'rect', bg: 'var(--danger-color)', r: 4, bgPath: "", glyph: '<path d="m4 18 5-12 5 12M6 14h6M15 15l2 2 4-5" stroke="var(--white)" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  'spinner': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: '<path d="M19 7a8 8 0 1 0 2 6" stroke="var(--white)" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M19 3v5h-5" stroke="var(--white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
  'square': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\" fill=\"var(--primary)\"/>" },
  'square-check': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<rect x=\"7\" y=\"7\" width=\"10\" height=\"10\" rx=\"2\" fill=\"none\" stroke=\"var(--white)\" stroke-width=\"1.6\"/>" },
  'star': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<path d=\"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\" fill=\"var(--accent-dark)\"/><path d=\"M12 2l-3.09 6.26L2 9.27l5 4.87-1.18 6.88L12 17.77V2z\" fill=\"var(--accent-dark)\"/>" },
  'stop': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\" fill=\"var(--white)\"/>" },
  'stopwatch': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"var(--secondary)\" stroke-width=\"2\" fill=\"none\"/><path d=\"M12 7v5l3 3\" stroke=\"var(--secondary)\" stroke-width=\"2\" stroke-linecap=\"round\" fill=\"none\"/><circle cx=\"12\" cy=\"16\" r=\"1.5\" fill=\"var(--secondary)\"/>" },
  'sun': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: "<circle cx=\"12\" cy=\"12\" r=\"5\" fill=\"var(--accent-dark)\"/><g stroke=\"var(--accent-dark)\" stroke-width=\"2\" stroke-linecap=\"round\"><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3.5\"/><line x1=\"12\" y1=\"20.5\" x2=\"12\" y2=\"23\"/><line x1=\"1\" y1=\"12\" x2=\"3.5\" y2=\"12\"/><line x1=\"20.5\" y1=\"12\" x2=\"23\" y2=\"12\"/><line x1=\"4.2\" y1=\"4.2\" x2=\"6\" y2=\"6\"/><line x1=\"18\" y1=\"18\" x2=\"19.8\" y2=\"19.8\"/><line x1=\"4.2\" y1=\"19.8\" x2=\"6\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"19.8\" y2=\"4.2\"/></g>" },
  'tag': { badge: 'circle', bg: 'var(--accent-dark)', r: 0, bgPath: "", glyph: "<path d=\"M6 6h5l7 7-5 5-7-7V6z\" fill=\"var(--white)\"/><circle cx=\"9\" cy=\"9\" r=\"1.2\" fill=\"var(--accent-dark)\"/>" },
  'telegram': { badge: 'rect', bg: 'var(--primary)', r: 12, bgPath: "", glyph: "<path d=\"M18 6L4.5 11.3c-.9.35-.9.9-.15 1.1l3.5 1.1 1.35 4.1c.16.4.3.55.6.55.3 0 .45-.13.6-.3l1.6-1.55 3.4 2.5c.6.35 1.05.15 1.2-.55L19.9 6.9c.25-.9-.35-1.3-1.2-.9z\" fill=\"var(--white)\"/>" },
  'thumbs-up': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M8 11v8H5v-8h3zm0 0l3.5-6a1.5 1.5 0 012.7.9L13.5 10H18a1.5 1.5 0 011.4 2l-1.8 6a2 2 0 01-1.9 1.4H11a3 3 0 01-3-3v-5.4z\" fill=\"var(--white)\"/>" },
  'tiktok': { badge: 'rect', bg: 'var(--text)', r: 6, bgPath: "", glyph: "<path d=\"M13 4v10.2a2.3 2.3 0 11-2-2.28V9.8a4.4 4.4 0 103.8 4.4V9.4a5.6 5.6 0 003.2 1V8.2a3.6 3.6 0 01-2.9-2.6 3.7 3.7 0 01-.1-.9V4h-2z\" fill=\"var(--white)\"/>" },
  'trash': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<path d=\"M6 8h12l-1 11a1 1 0 01-1 1H8a1 1 0 01-1-1L6 8zM9 8V6a1 1 0 011-1h4a1 1 0 011 1v2M5 8h14\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\" fill=\"none\"/>" },
  'trophy': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4zM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5m-4 3h8m-6-3h4" stroke="var(--white)" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  'unlock': { badge: 'circle', bg: 'var(--secondary)', r: 0, bgPath: "", glyph: "<rect x=\"7.5\" y=\"11\" width=\"9\" height=\"7\" rx=\"1.5\" fill=\"var(--white)\"/><path d=\"M9 11V8.5a3 3 0 015.7-1.3\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\"/>" },
  'user': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="12" cy="8" r="3.5" fill="var(--white)"/><path d="M5 20a7 7 0 0 1 14 0" stroke="var(--white)" stroke-width="1.8" fill="none" stroke-linecap="round"/>' },
  'user-check': { badge: 'rect', bg: 'var(--primary)', r: 4, bgPath: "", glyph: "<circle cx=\"12\" cy=\"8\" r=\"3\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\"/><path d=\"M6 19c.5-3 2.5-4.5 6-4.5s5.5 1.5 6 4.5\" stroke=\"var(--white)\" stroke-width=\"1.5\" fill=\"none\"/>" },
  'user-graduate': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="12" cy="9" r="3" stroke="var(--white)" stroke-width="1.5" fill="none"/><path d="M6 20a6 6 0 0 1 12 0M3 6l9-4 9 4-9 4-9-4zM18 8v4" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>' },
  'user-pen': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="9" cy="8" r="3" stroke="var(--white)" stroke-width="1.5" fill="none"/><path d="M3 20a6 6 0 0 1 12 0M15 14l5-5 2 2-5 5-2 1z" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>' },
  'user-plus': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="9" cy="8" r="3" stroke="var(--white)" stroke-width="1.5" fill="none"/><path d="M3 20a6 6 0 0 1 12 0M18 7v6M15 10h6" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
  'users': { badge: 'none', bg: '', r: 0, bgPath: "", glyph: '<circle cx="9" cy="8" r="3" stroke="var(--white)" stroke-width="1.5" fill="none"/><circle cx="17" cy="9" r="2.5" stroke="var(--white)" stroke-width="1.5" fill="none"/><path d="M3 20a6 6 0 0 1 12 0M15 15a4 4 0 0 1 6 3" stroke="var(--white)" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
  'volume-high': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M5 10v4h3l4 3V7l-4 3H5z\" fill=\"var(--white)\"/><path d=\"M15.5 9a4 4 0 010 6M17.5 6.5a7.5 7.5 0 010 11\" stroke=\"var(--white)\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\"/>" },
  'volume-xmark': { badge: 'circle', bg: 'var(--primary)', r: 0, bgPath: "", glyph: "<path d=\"M5 10v4h3l4 3V7l-4 3H5z\" fill=\"var(--white)\"/><line x1=\"15.5\" y1=\"9.5\" x2=\"19.5\" y2=\"14.5\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><line x1=\"19.5\" y1=\"9.5\" x2=\"15.5\" y2=\"14.5\" stroke=\"var(--white)\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>" },
  'whatsapp': { badge: 'rect', bg: 'var(--success-color)', r: 12, bgPath: "", glyph: "<path d=\"M7 17l1-3.2a6 6 0 111.9 1.9L7 17z\" stroke=\"var(--white)\" stroke-width=\"1.4\" fill=\"none\"/><path d=\"M9.5 9.7c0-.4.4-.5.6-.5s.4 0 .5.3c.15.35.5 1.2.5 1.3.05.1.05.25 0 .35-.1.2-.15.3-.3.45-.15.15-.3.3-.15.55.15.3.7 1.1 1.5 1.4.5.2.6.15.75 0 .15-.15.5-.6.6-.8.1-.2.2-.15.35-.1.15.05 1 .5 1.15.6.15.1.25.15.3.2.05.1.05.5-.15.9-.2.4-1 .8-1.4.8-.4 0-1.5-.15-2.7-1.2-1.5-1.3-2.2-2.7-2.3-2.9-.1-.2-.55-.9-.55-1.4z\" fill=\"var(--white)\"/>" },
  'x-twitter': { badge: 'rect', bg: 'var(--text)', r: 5, bgPath: "", glyph: "<path d=\"M7 6l4.2 6.1L7 18h1.5l3.4-4.4L15 18h3l-4.5-6.4L17.5 6H16l-3.2 4L10 6H7z\" fill=\"var(--white)\"/>" },
  'xmark': { badge: 'circle', bg: 'var(--danger-color)', r: 0, bgPath: "", glyph: "<path d=\"M8 8l8 8M16 8l-8 8\" stroke=\"var(--white)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>" },
  'youtube': { badge: 'rect', bg: 'var(--danger-color)', r: 6, bgPath: "", glyph: "<path d=\"M10 8.5l6 3.5-6 3.5v-7z\" fill=\"var(--white)\"/>" },

  'dna': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M7 3c0 4 10 4 10 9s-10 5-10 9M17 3c0 4-10 4-10 9s10 5 10 9M8 6h8M7 12h10M8 18h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="7" cy="3" r="1.5" fill="currentColor"/><circle cx="17" cy="21" r="1.5" fill="currentColor"/>' },
  'cell': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M12 3c4.8 0 8.5 3.8 8.5 8.8S16.8 21 12 21 3.5 17.1 3.5 12 7.2 3 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="9" r="1" fill="currentColor"/><circle cx="16.5" cy="15.5" r="1.2" fill="currentColor"/><path d="M8 16c1.2-1 1.8-1.1 2.5-.8M14 7.5c1 .2 1.6.7 2 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  'pill-bottle': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M8 3h8v4H8zM7 7h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 12h8M8 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
  'file-search': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M6 3h8l5 5v7M14 3v5h5M6 3v18h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 11h6M9 14h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="17" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m19.2 20.2 2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' },
  'clinical-case': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8h6M9 17h6M12 11v4M10 13h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
  'brain-circuit': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M12 4a3 3 0 0 0-5.7 1.2A3.5 3.5 0 0 0 5 11.5a3.5 3.5 0 0 0 2.5 6A3 3 0 0 0 12 20V4Zm0 0a3 3 0 0 1 5.7 1.2A3.5 3.5 0 0 1 19 11.5a3.5 3.5 0 0 1-2.5 6A3 3 0 0 1 12 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8 8h2m4 0h2M7 13h3m4 0h3M9 17h2m2-9v3m0 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
  'bullseye': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>' },
  'triangle-exclamation': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M12 3 2.8 20h18.4L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v5m0 3h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  'refresh': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M20 7v5h-5M4 17v-5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
  'envelope-circle': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="6.5" y="8.5" width="11" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m7 9 5 4 5-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' },
  'grid': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>' },
  'list': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>' },
  'expand': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M8 3H3v5m0-5 6 6M16 3h5v5m0-5-6 6M8 21H3v-5m0 5 6-6m7 6h5v-5m0 5-6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  'alert-circle': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v6m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  'video': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<rect x="3" y="6" width="13" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 10 5-3v10l-5-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' },
  'video-slash': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<rect x="3" y="6" width="13" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 10 5-3v10l-5-3zM4 4l16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  'desktop': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<rect x="2.5" y="4" width="19" height="13" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 21h8m-4-4v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
  'pencil': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m14.8 5.7 3.5 3.5" stroke="currentColor" stroke-width="1.8"/>' },
  'eraser': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="m7 20-4-4a2 2 0 0 1 0-2.8l8.2-8.2a2 2 0 0 1 2.8 0l7 7a2 2 0 0 1 0 2.8L16 20H7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 10 6 6m-8 4 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/>' },
  'shapes': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 4 5 9h-10l5-9ZM17 15l4 6h-8l4-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' },
  'palette': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1.4A3.5 3.5 0 0 0 21 11.2 8.5 8.5 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7.5" r="1" fill="currentColor"/><circle cx="15" cy="8" r="1" fill="currentColor"/>' },
  'undo': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  'redo': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="m15 14 5-5-5-5m5 5h-9a7 7 0 0 0 0 14h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  'pen-fancy': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="m4 20 4.2-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m14.5 6.5 3 3M4 20l5-1" fill="none" stroke="currentColor" stroke-width="1.8"/>' },
  'comment-dots': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/>' },
  'smile': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
  'ellipsis-vertical': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>' },
  'file-export': { badge: 'none', bg: '', r: 0, bgPath: '', glyph: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6M13 3l5 5h-5V3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 16h7m-3-3 3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' }

};

const Icon = memo(function Icon({
  name,
  size,
  className,
  style,
  plain = false,
  monochrome = false,
  ...props
}) {
  const entry = ICON_DATA[name] || ICON_DATA['circle-info'];

  const { badge, bg, r, bgPath, glyph } = entry;
  const renderedGlyph = monochrome ? glyph.replace(/var\(--[^)]+\)/g, 'currentColor') : glyph;

  let bgMarkup = '';

  if (!plain && !monochrome) {
    if (badge === 'rect') {
      bgMarkup = `<rect x="1" y="1" width="22" height="22" rx="${r}" fill="${bg}"/>`;
    } else if (badge === 'circle') {
      bgMarkup = `<circle cx="12" cy="12" r="11" fill="${bg}"/>`;
    } else if (bgPath) {
      bgMarkup = bgPath;
    }
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size || '1.25em'}
      height={size || '1.25em'}
      className={className || undefined}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-hidden'] ?? true}
      focusable="false"
      {...props}
    >
      {bgMarkup && (
        <g dangerouslySetInnerHTML={{ __html: bgMarkup }} />
      )}

      <g
        className={plain ? 'icon-plain-glyph' : undefined}
        dangerouslySetInnerHTML={{ __html: renderedGlyph }}
      />
    </svg>
  );
});

export default Icon;
export { ICON_DATA };
