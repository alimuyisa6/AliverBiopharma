 // features/pdfs/PdfPreviewModal.jsx
import React from 'react';
import DownloadButton from '../../components/ui/DownloadButton';

export function PdfPreviewModal({ pdf, onClose, onDownload }) {
  if (!pdf) return null;

  return (
    <div className="pdf-preview-modal active" onClick={onClose}>
      <div className="pdf-preview-content" onClick={e => e.stopPropagation()}>
        <div className="pdf-preview-header">
          <h3>{pdf.title}</h3>
          <button className="pdf-preview-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pdf-preview-body">
          <iframe src={pdf.file_url} frameBorder="0"></iframe>
        </div>
        <div className="pdf-preview-footer">
          <DownloadButton onClick={() => onDownload(pdf)}>Download PDF</DownloadButton>
          <button className="btn btn-ghost" onClick={onClose}>Back to Library</button>
        </div>
      </div>
    </div>
  );
}
