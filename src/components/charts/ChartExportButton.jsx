import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportCsv(data, filename) {
  if (!Array.isArray(data) || !data.length) return;

  const keys = Array.from(
    data.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const escapeCell = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = [
    keys.map(escapeCell).join(','),
    ...data.map((row) => keys.map((key) => escapeCell(row?.[key])).join(','))
  ].join('\n');

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

async function exportPng(targetRef, filename) {
  const target = targetRef?.current;
  const svg = target?.querySelector('svg');

  if (!svg) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    image.src = url;
    await loaded;

    const rect = svg.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const context = canvas.getContext('2d');
    const background = getComputedStyle(document.body).getPropertyValue('--bg-card').trim();

    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename);
    }, 'image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ChartExportButton({
  data = [],
  targetRef,
  filename = 'aliverbiopharm-chart'
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleExport = async (type) => {
    setOpen(false);

    if (type === 'csv') {
      exportCsv(data, `${filename}.csv`);
      return;
    }

    try {
      await exportPng(targetRef, `${filename}.png`);
    } catch {
      return;
    }
  };

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
        aria-label="Export chart"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Download aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg" role="menu">
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600" role="menuitem" onClick={() => handleExport('csv')}>
            Export CSV
          </button>
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600" role="menuitem" onClick={() => handleExport('png')}>
            Export PNG
          </button>
        </div>
      )}
    </div>
  );
}