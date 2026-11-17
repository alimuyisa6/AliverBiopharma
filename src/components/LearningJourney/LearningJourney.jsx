import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { getPdfDownloadUrl, getPastPaperDownloadUrl } from '../../api/client';
import { getCurriculumNode } from '../../api/curriculumNavigation';
import { isPremiumAccessError, redirectToSubscription } from '../../utils/subscriptionNavigation';
import { buildLearningStages } from '../../utils/learningJourney';

const journeyCache = new Map();

export default function LearningJourney({
  unitId,
  noteId = null,
  internalLinks = null,
  linkedContent: suppliedLinkedContent,
  nodeName = '',
  nodeType = '',
  returnTo = '',
  excludeStages = [],
  resourceFocus = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fetchedLinkedContent, setFetchedLinkedContent] = useState(() => (
    unitId ? journeyCache.get(String(unitId)) ?? [] : []
  ));
  const [loading, setLoading] = useState(Boolean(unitId) && !Array.isArray(suppliedLinkedContent) && !journeyCache.has(String(unitId)));
  const [downloadId, setDownloadId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (Array.isArray(suppliedLinkedContent)) {
      setFetchedLinkedContent(suppliedLinkedContent);
      setLoading(false);
      return undefined;
    }

    if (!unitId) {
      setFetchedLinkedContent([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    const key = String(unitId);
    const cached = journeyCache.get(key);

    if (cached) {
      setFetchedLinkedContent(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    getCurriculumNode(unitId)
      .then((result) => {
        if (!active) return;
        const items = Array.isArray(result?.linked_content) ? result.linked_content : [];
        journeyCache.set(key, items);
        setFetchedLinkedContent(items);
      })
      .catch(() => {
        if (active && !cached) setFetchedLinkedContent([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unitId, suppliedLinkedContent]);

  const source = Array.isArray(suppliedLinkedContent) ? suppliedLinkedContent : fetchedLinkedContent;
  const stages = useMemo(() => buildLearningStages({
    source,
    noteId,
    internalLinks,
    unitId,
    nodeType,
    returnTo,
    excludeStages,
    focusStage: resourceFocus
  }), [source, noteId, internalLinks, unitId, nodeType, returnTo, excludeStages, resourceFocus]);

  async function openDownload(item, type) {
    const key = type + '-' + item.id;
    if (downloadId) return;

    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;

    setDownloadId(key);
    setActionError('');

    try {
      const result = type === 'pdf'
        ? await getPdfDownloadUrl(item.id)
        : await getPastPaperDownloadUrl(item.id);

      if (!result?.url) throw new Error('A download link was not returned.');

      if (popup) {
        popup.location.href = result.url;
      } else {
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      if (popup) popup.close();
      if (isPremiumAccessError(error)) {
        redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
        return;
      }
      setActionError(error?.message || 'This resource could not be opened. Please try again.');
    } finally {
      setDownloadId(null);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto mt-12 w-full max-w-7xl border-t border-border px-4 py-10 sm:px-6" aria-live="polite">
        <div className="mb-7 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-800">Keep learning</span>
          <h2>Finding your next steps</h2>
          <p>Connecting the reading, revision and practice materials for this learning area.</p>
        </div>
        <div className="mx-auto mt-8 max-w-7xl px-4 text-sm text-slate-600" />
      </section>
    );
  }

  if (!stages.length) return null;

  return (
    <section className="learning-journey" aria-labelledby="learning-journey-title">
      <div className="learning-journey-heading">
        <span className="learning-journey-eyebrow">Keep learning</span>
        <h2 id="learning-journey-title">Continue exploring{nodeName ? ' ' + nodeName : ''}</h2>
        <p>These materials are connected to the same curriculum area, so you can move naturally from reading to revision and exam practice.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {stages.map((stage, index) => (
          <section className={`rounded-2xl border p-5 sm:p-6 ${stage.key === (({ quizzes: "quiz", past_papers: "papers", "past-papers": "papers" })[resourceFocus] || resourceFocus) ? "border-primary-300 bg-primary-50" : "border-border bg-white"}`} key={stage.key} aria-labelledby={'learning-journey-' + stage.key}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-800"><Icon name={stage.meta.icon} /></span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-secondary-800">Stage {String(index + 1).padStart(2, '0')}</span>
                  <h3 id={'learning-journey-' + stage.key}>{stage.meta.title}</h3>
                  <p>{stage.meta.description}</p>
                </div>
                <span className="ml-auto rounded-full bg-background px-3 py-1 text-xs font-semibold text-slate-600">{stage.items.length} {stage.items.length === 1 ? 'resource' : 'resources'}</span>
              </div>

              <div className="grid gap-2">
                {stage.items.map((item) => {
                  const content = (
                    <>
                      <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                        <strong>{item.title}</strong>
                        {item.detail && <small>{item.detail}</small>}
                        {item.preview && <small>{item.preview}</small>}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-primary-800">
                        {item.action
                          ? downloadId === item.action + '-' + item.id ? 'Opening…' : item.action === 'pdf' ? 'Open PDF' : 'Download paper'
                          : 'Continue'}
                        <Icon name="arrow-right" />
                      </span>
                    </>
                  );

                  return item.action ? (
                    <button
                      type="button"
                      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-foreground no-underline transition hover:border-primary-300 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-wait disabled:opacity-60"
                      key={stage.key + '-' + item.id}
                      onClick={() => openDownload(item, item.action)}
                      disabled={Boolean(downloadId)}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      className="learning-journey-item"
                      key={stage.key + '-' + item.id}
                      to={item.to}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {actionError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900" role="alert">{actionError}</p>}
    </section>
  );
}
