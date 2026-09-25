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
import Button from '../components/Button/Button';
import Container from '../components/Container/Container';

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

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;

    loadPdfs(mounted);

    return () => {
      mounted = false;
    };
  }, [access.canAccess, level, class_name, curriculumUnitId]);

  async function loadPdfs(mounted = true) {
    setLoading(true);
    setError(null);

    try {
      const data = await getPdfsByLevel(curriculumUnitId);

      if (mounted) setPdfs(Array.isArray(data) ? data : []);
    } catch {
      if (mounted) setError('Failed to load PDF resources.');
    } finally {
      if (mounted) setLoading(false);
    }
  }

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find(
      (item) => item.component_key === `empty_state_${key}`
    );

    return component?.properties?.image_url || null;
  }

  function sortPdfs(items) {
    return [...items].sort((a, b) => {
      if (sortBy === 'author') {
        return String(a.author || '').localeCompare(String(b.author || ''));
      }

      if (sortBy === 'size') {
        return String(a.file_size || '').localeCompare(String(b.file_size || ''));
      }

      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  if (!access.canAccess) {
    return (
      <Container>
        <EmptyState
          image={getEmptyStateImage('pdfs')}
          title="Access Restricted"
          description="Your account does not have access to the PDF library."
        />
      </Container>
    );
  }

  const levelName = displayName || level || '';
  const classLabel = class_name || '';
  const sortedPdfs = sortPdfs(pdfs);

  return (
    <Container>
      <div className="pdf-library-page">
        <div className="toolbar">
          <span className="result-count">
            <strong>{pdfs.length}</strong>{' '}
            {pdfs.length === 1 ? 'document' : 'documents'}
          </span>

          <div className="toolbar-spacer" />

          <select
            className="sort-select"
            id="sortSelect"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort documents"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="size">Size</option>
          </select>
        </div>

        <div className="pdf-library-heading">
          <h1 className="section-title pdf-library-title">PDF Library</h1>

          {(levelName || classLabel) && (
            <p className="pdf-library-class">
              {levelName}
              {levelName && classLabel ? ' · ' : ''}
              {classLabel}
            </p>
          )}
        </div>

        {curriculumUnitId && (
          <p className="pdf-library-class">
            Showing resources for this curriculum node.
          </p>
        )}

        {loading ? (
          <div className="pdf-skeleton-grid">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        ) : error ? (
          <EmptyState
            image={getEmptyStateImage('error')}
            title="Error"
            description={error}
            action={<Button onClick={() => loadPdfs()}>Try Again</Button>}
          />
        ) : pdfs.length === 0 ? (
          <EmptyState
            image={getEmptyStateImage('pdfs')}
            title="No PDFs Available"
          />
        ) : (
          <div className="pdf-grid">
            {sortedPdfs.map((pdf) => (
              <div key={pdf.id} className="card pdf-card">
                <div className="card-image-placeholder pdf-card-image">
                  <Icon name="file-pdf" className="pdf-card-icon" />
                </div>

                <div className="card-body">
                  <h3 className="card-title">{pdf.title}</h3>
                  {pdf.author && <p className="card-text">{pdf.author}</p>}
                  {pdf.file_size && <span className="chip">{pdf.file_size}</span>}
                </div>

                <div className="card-footer">
                  <a
                    href={pdf.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <Icon name="download" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
