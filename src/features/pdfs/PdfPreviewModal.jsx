import React from 'react';
import DownloadButton from '../../components/ui/DownloadButton';

export function PdfPreviewModal({ pdf, onClose, onDownload }) {
  if (!pdf) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6" onClick={onClose}>
      <div className="my-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-4 border-b border-border bg-primary-50 p-4 sm:p-5">
          <h2 className="min-w-0 text-lg font-extrabold text-primary-900">{pdf.title}</h2>
          <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-primary-800 hover:bg-primary-100" onClick={onClose} aria-label="Close PDF preview"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 bg-slate-100"><iframe title={`${pdf.title} PDF preview`} className="h-[70vh] min-h-[320px] w-full border-0" src={pdf.file_url} /></div>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-white p-4"><DownloadButton onClick={() => onDownload(pdf)}>Download PDF</DownloadButton><button type="button" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-primary-800 hover:bg-primary-50" onClick={onClose}>Back to Library</button></footer>
      </div>
    </div>
  );
}
