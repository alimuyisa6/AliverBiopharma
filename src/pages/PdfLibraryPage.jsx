/* pages/PdfLibraryPage.jsx */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
import { useAuth } from '../contexts/AuthContext';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useLayout } from '../contexts/LayoutContext';
import { getPdfsByLevel } from '../api/client';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import EmptyComponent from '../components/ui/empty8';
import Button from '../components/Button/Button';
import DynamicActions from '../components/DynamicActions';
import Container from '../components/Container/Container';
import './PdfLibraryPage.css';

export default function PdfLibraryPage() {
  const access = useContentAccess();
  const { user } = useAuth();
  const { level, class_name, displayName } = useLevelFilter();
  const activeGroupId = user?.profile?.active_group_id || null;
  const { bootstrap } = useLayout();
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('title');
  
  useEffect(() => {
    if (access.loading || !access.canAccess) return undefined;
    let mounted = true;

    // Never render a previous class's cached PDFs while the active curriculum
    // scope changes. The server resolves the authorised group from the session.
    setPdfs([]);
    setLoading(true);
    setError(null);
    loadPdfs(() => mounted, true);

    return () => { mounted = false; };
  }, [access.loading, access.canAccess, level, class_name, activeGroupId, curriculumUnitId]);

  async function loadPdfs(isMounted = () => true, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Scope the client-side in-flight request key to the current curriculum.
      // The server still authorises the request from the authenticated session.
      const requestScope = activeGroupId || `${level || ''}:${class_name || ''}`;
      const data = await getPdfsByLevel(curriculumUnitId, requestScope);
      const nextPdfs = Array.isArray(data) ? data : [];
      if (isMounted()) setPdfs(nextPdfs);
    } catch {
      if (isMounted()) setError("We couldn't load the PDF resources. Please try again.");
    } finally {
      if (isMounted()) setLoading(false);
    }
  }

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  function sortPdfs(items) {
    return [...items].sort((a, b) => {
      if (sortBy === 'author') return String(a.author || '').localeCompare(String(b.author || ''));
      if (sortBy === 'size') return String(a.file_size || '').localeCompare(String(b.file_size || ''));
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  if (access.loading) {
    return (
      <Container className="pdf-library-section">
        <div className="pdf-library-page">
          <div className="pdf-skeleton-grid">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        </div>
      </Container>
    );
  }

  if (!access.canAccess) {
    return (
      <Container className="pdf-library-section">
        <EmptyState image={getEmptyStateImage('pdfs')} title="PDF library access is restricted" description="Your account doesn’t currently have access to these PDF resources." />
      </Container>
    );
  }

  const levelName = displayName || level || '';
  const classLabel = class_name || '';
  const sortedPdfs = sortPdfs(pdfs);

  return (
    <Container className="pdf-library-section">
      <div className="pdf-library-page">
        <section className="pdf-library-controls" aria-labelledby="pdf-library-controls-title">
          <div className="pdf-library-controls-copy">
            <h2 id="pdf-library-controls-title">Find study PDFs and reference guides</h2>
            <p>Sort the library by title, author, or file size to find the right document.</p>
          </div>
          <div className="toolbar">
            <div className="result-count" aria-live="polite">
              <span className="result-count-label">PDFs available</span>
              <strong>{pdfs.length}</strong>
              <span>{pdfs.length === 1 ? 'PDF' : 'PDFs'}</span>
            </div>
            <div className="toolbar-spacer" />
            <label className="sort-control" htmlFor="sortSelect">
              <span>Sort by:</span>
              <select className="sort-select" id="sortSelect" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="size">File size</option>
              </select>
            </label>
          </div>
        </section>

        <div className="pdf-library-heading">
          <h1 className="section-title pdf-library-title">Study PDFs</h1>
          {(levelName || classLabel) && (
            <p className="pdf-library-class">
              {levelName}{levelName && classLabel ? ' · ' : ''}{classLabel}
            </p>
          )}
        </div>

        {curriculumUnitId && <p className="pdf-library-class">Showing PDFs for this selected learning area.</p>}

        {loading ? (
          <div className="pdf-skeleton-grid">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        ) : error ? (
          typeof navigator !== 'undefined' && !navigator.onLine ? (
            <EmptyComponent
              title="No internet connection"
              description="We couldn’t load your PDFs. Check your internet connection and try again."
              onRetry={() => loadPdfs(() => true, true)}
            />
          ) : (
            <EmptyState image={getEmptyStateImage('error')} title="We couldn’t load your PDFs" description={error} action={<Button onClick={() => loadPdfs(() => true, true)}>Try again</Button>} />
          )
        ) : pdfs.length === 0 ? (
          <EmptyState image={getEmptyStateImage('pdfs')} title="No PDFs are available for this selection yet." />
        ) : (
          <div className="pdf-grid">
            {sortedPdfs.map((pdf) => (
              <article key={pdf.id} className="pdf-card">
                <span
                  className={`pdf-premium-ribbon ${pdf.is_premium ? 'pdf-premium-ribbon--premium' : 'pdf-premium-ribbon--free'}`}
                  aria-label={pdf.is_premium ? 'Premium PDF' : 'Free PDF'}
                />
                <div className="pdf-card-body">
                  <h3 className="pdf-card-title">{pdf.title}</h3>
                  {pdf.author && !/^(aliverbiopharm|aliver biopharm|aliver-biopharma|aliverbiopharm\.com|aliver-biopharma\.vercel\.app)$/i.test(String(pdf.author).trim()) && <p className="pdf-card-author">{pdf.author}</p>}
                  {pdf.file_size && <span className="pdf-card-size">{pdf.file_size}</span>}
                </div>
                <div className="pdf-card-footer">
                  <DynamicActions pageId="pdf-library" contentType="pdf" contentId={pdf.id} className="pdf-download-actions" />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
