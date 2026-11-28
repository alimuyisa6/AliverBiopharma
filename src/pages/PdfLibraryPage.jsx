/* pages/PdfLibraryPage.jsx */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
import { useAuth } from '../contexts/AuthContext';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useLayout } from '../contexts/LayoutContext';
import { getPdfsByLevel, getPdfDownloadUrl } from '../api/client';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import EmptyComponent from '../components/ui/empty8';
import Button from '../components/Button/Button';
import DynamicActions from '../components/DynamicActions';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import { isPremiumAccessError, redirectToSubscription } from '../utils/subscriptionNavigation';
import { getCachedStale, setCache } from '../utils/cache';
import { useToast } from '../components/Toast/Toast';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

export default function PdfLibraryPage() {
  const access = useContentAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToast();
  const { level, class_name, displayName } = useLevelFilter();
  const activeGroupId = user?.profile?.active_group_id || null;
  const { bootstrap } = useLayout();
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const pdfScopeKey = activeGroupId || `${level || ''}:${class_name || ''}`;
  const pdfCacheKey = `pdfs_page_${user?.id || 'guest'}:${pdfScopeKey}:${curriculumUnitId || 'all'}`;
  const initialPdfs = getCachedStale(pdfCacheKey);
  const [pdfs, setPdfs] = useState(() => initialPdfs || []);
  const [loading, setLoading] = useState(() => !initialPdfs);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('title');
  
  useEffect(() => {
    if (access.loading || !access.canAccess) return undefined;
    let mounted = true;

    const cacheKey = pdfCacheKey;
    const cached = initialPdfs;
    if (cached) {
      setPdfs(cached);
      setLoading(false);
    } else {
      setPdfs([]);
      setLoading(true);
    }
    setError(null);
    loadPdfs(() => mounted, !cached);

    return () => { mounted = false; };
  }, [access.loading, access.canAccess, user?.id, level, class_name, activeGroupId, curriculumUnitId]);

  async function loadPdfs(isMounted = () => true, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Scope the client-side in-flight request key to the current curriculum.
      // The server still authorises the request from the authenticated session.
      const requestScope = activeGroupId || `${level || ''}:${class_name || ''}`;
      const data = await getPdfsByLevel(curriculumUnitId, activeGroupId, requestScope);
      const nextPdfs = Array.isArray(data) ? data : [];
      const cacheKey = `pdfs_page_${user?.id || 'guest'}:${requestScope}:${curriculumUnitId || 'all'}`;
      setCache(cacheKey, nextPdfs);
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

  async function handlePremiumPdfDownload(pdf) {
    try {
      const result = await getPdfDownloadUrl(pdf.id);
      if (!result?.url) throw new Error('A download link was not returned.');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      if (isPremiumAccessError(downloadError)) {
        redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
        return;
      }
      addToast(downloadError?.message || "We couldn't download this PDF. Please try again.", 'error');
    }
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
      <main className="min-h-screen w-full bg-background text-foreground">
        <Container className="py-8 sm:py-10">
        <div className="w-full min-w-0 text-foreground">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        </div>
        </Container>
      </main>
    );
  }

  if (!access.canAccess) {
    return (
      <main className="min-h-screen w-full bg-background text-foreground">
        <Container className="py-8 sm:py-10">
          <EmptyState image={getEmptyStateImage('pdfs')} title="PDF library access is restricted" description="Your account doesn’t currently have access to these PDF resources." />
        </Container>
      </main>
    );
  }

  const levelName = displayName || level || '';
  const classLabel = class_name || '';
  const sortedPdfs = sortPdfs(pdfs);

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <Container className="py-8 sm:py-10">
      <div className="w-full min-w-0 text-foreground">
        <Breadcrumb className="mb-6" items={[{ label: 'Home', href: '/' }, { label: 'PDF library' }]} />
        <PageHeader
          title="PDF library"
          subtitle="Course notes and reference documents for your programme."
          className="mt-8 border-b border-border bg-background px-0 py-7"
        />
        {(levelName || classLabel) && <p className="mt-4 text-sm font-semibold text-muted">{levelName}{levelName && classLabel ? ' · ' : ''}{classLabel}</p>}

        <section className="mt-8 grid gap-5 rounded-2xl border border-primary-900 bg-primary-900 p-5 text-white shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" aria-labelledby="pdf-library-controls-title">
          <div className="max-w-xl">
            <h2 id="pdf-library-controls-title" className="text-xl font-bold text-white">Find a document</h2>
            <p className="mt-2 text-sm leading-6 text-primary-100">Sort by title, author, or file size.</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white" aria-live="polite">
              <span className="font-semibold">PDFs available</span><strong className="text-lg">{pdfs.length}</strong><span>{pdfs.length === 1 ? 'PDF' : 'PDFs'}</span>
            </div>
            <label className="flex w-full flex-col gap-2 text-sm font-semibold text-white sm:w-auto sm:flex-row sm:items-center" htmlFor="sortSelect">
              <span>Sort by:</span>
              <select className={`${UI.selectBase} border-white bg-white text-primary-900 sm:min-w-44`} id="sortSelect" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="title">Title</option><option value="author">Author</option><option value="size">File size</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-secondary-50 p-4 sm:p-6" aria-label="Available PDF documents">
        {curriculumUnitId && <p className="mb-5 text-sm font-semibold text-secondary-950">Showing documents for this topic.</p>}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 xl:grid-cols-3"><Skeleton height={160} /><Skeleton height={160} /><Skeleton height={160} /></div>
        ) : error ? (
          typeof navigator !== 'undefined' && !navigator.onLine ? (
            <EmptyComponent title="No internet connection" description="We couldn’t load your PDFs. Check your internet connection and try again." onRetry={() => loadPdfs(() => true, true)} />
          ) : (
            <EmptyState image={getEmptyStateImage('error')} title="We couldn’t load your PDFs" description={error} action={<Button onClick={() => loadPdfs(() => true, true)}>Try again</Button>} />
          )
        ) : pdfs.length === 0 ? (
          <EmptyState image={getEmptyStateImage('pdfs')} title="No PDFs are available for this selection yet." />
        ) : (
          <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
            {sortedPdfs.map((pdf) => (
              <article key={pdf.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg">
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${pdf.is_premium ? 'bg-secondary-100 text-secondary-900' : 'bg-emerald-100 text-emerald-900'}`} aria-label={pdf.is_premium ? 'Premium PDF' : 'Free PDF'}>{pdf.is_premium ? 'Premium' : 'Free'}</span>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-50">
                  <img className="h-full w-full object-cover" src={pdf.cover_image_url || pdf.thumbnail_url || pdf.image_url || 'https://images.pexels.com/photos/7972795/pexels-photo-7972795.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'} alt={pdf.title} loading="lazy" width="900" height="600" />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-primary-900/90 px-3 py-1.5 text-xs font-bold text-white">PDF resource</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-lg font-bold leading-6 text-primary-900">{pdf.title}</h3>
                  {pdf.author && !/^(aliverbiopharm|aliver biopharm|aliver-biopharma|aliverbiopharm\.com|aliver-biopharma\.vercel\.app)$/i.test(String(pdf.author).trim()) && <p className="text-sm text-muted">{pdf.author}</p>}
                  {pdf.file_size && <span className="text-xs font-semibold text-muted">{pdf.file_size}</span>}
                </div>
                <div className="mt-auto border-t border-border p-5">
                  {pdf.is_premium ? <Button type="button" variant="primary" onClick={() => handlePremiumPdfDownload(pdf)}><Icon name="lock" /> Access premium PDF</Button> : <DynamicActions pageId="pdf-library" contentType="pdf" contentId={pdf.id} />}
                </div>
              </article>
            ))}
          </div>
        )}
        </section>
        {curriculumUnitId && <LearningJourney unitId={curriculumUnitId} excludeStages={['pdfs']} returnTo={'/pdfs?unit_id=' + encodeURIComponent(curriculumUnitId)} />}
      </div>
      </Container>
    </main>
  );
}
