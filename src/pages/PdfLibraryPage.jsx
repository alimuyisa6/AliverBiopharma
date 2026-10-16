/* pages/PdfLibraryPage.jsx */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
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

const pdfLibraryCache = new Map();

export default function PdfLibraryPage() {
  const access = useContentAccess();
  const { level, class_name, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('title');
  const cacheKey = `${level || ''}:${class_name || ''}:${curriculumUnitId || 'all'}`;

  useEffect(() => {
    if (access.loading || !access.canAccess) return undefined;
    let mounted = true;
    const cachedPdfs = pdfLibraryCache.get(cacheKey);
    if (cachedPdfs) {
      setPdfs(cachedPdfs);
      setLoading(false);
      setError(null);
      loadPdfs(() => mounted, false);
    } else {
      loadPdfs(() => mounted, true);
    }
    return () => { mounted = false; };
  }, [access.loading, access.canAccess, level, class_name, curriculumUnitId]);

  async function loadPdfs(isMounted = () => true, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getPdfsByLevel(curriculumUnitId);
      const nextPdfs = Array.isArray(data) ? data : [];
      pdfLibraryCache.set(cacheKey, nextPdfs);
      if (isMounted()) setPdfs(nextPdfs);
    } catch {
      if (isMounted() && !pdfLibraryCache.has(cacheKey)) setError('Failed to load PDF resources.');
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
        <EmptyState image={getEmptyStateImage('pdfs')} title="Access Restricted" description="Your account does not have access to the PDF library." />
      </Container>
    );
  }

  const levelName = displayName || level || '';
  const classLabel = class_name || '';
  const sortedPdfs = sortPdfs(pdfs);

  return (
    <Container className="pdf-library-section">
      <div className="pdf-library-page">
        <div className="toolbar">
          <span className="result-count"><strong>{pdfs.length}</strong>{' '}{pdfs.length === 1 ? 'document' : 'documents'}</span>
          <div className="toolbar-spacer" />
          <select className="sort-select" id="sortSelect" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort documents">
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="size">Size</option>
          </select>
        </div>

        <div className="pdf-library-heading">
          <h1 className="section-title pdf-library-title">PDF Library</h1>
          {(levelName || classLabel) && (
            <p className="pdf-library-class">
              {levelName}{levelName && classLabel ? ' · ' : ''}{classLabel}
            </p>
          )}
        </div>

        {curriculumUnitId && <p className="pdf-library-class">Showing resources for this curriculum node.</p>}

        {loading ? (
          <div className="pdf-skeleton-grid">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        ) : error ? (
          typeof navigator !== 'undefined' && !navigator.onLine ? (
            <EmptyComponent
              title="No Internet Connection"
              description="Your PDF resources could not be reached. Reconnect to the internet and try loading them again."
              onRetry={() => loadPdfs(() => true, true)}
            />
          ) : (
            <EmptyState image={getEmptyStateImage('error')} title="Unable to Load PDFs" description={error} action={<Button onClick={() => loadPdfs(() => true, true)}>Try Again</Button>} />
          )
        ) : pdfs.length === 0 ? (
          <EmptyState image={getEmptyStateImage('pdfs')} title="No PDFs Available" />
        ) : (
          <div className="pdf-grid">
            {sortedPdfs.map((pdf) => (
              <article key={pdf.id} className="pdf-card">
                <span
                  className={`pdf-premium-ribbon ${pdf.is_premium ? 'pdf-premium-ribbon--premium' : 'pdf-premium-ribbon--free'}`}
                  aria-label={pdf.is_premium ? 'Premium PDF' : 'Free PDF'}
                />
                <div className="pdf-card-body">
                  <div className="pdf-card-type"><Icon name="file-pdf" className="pdf-card-icon" /></div>
                  <h3 className="pdf-card-title">{pdf.title}</h3>
                  {pdf.author && <p className="pdf-card-author">{pdf.author}</p>}
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
