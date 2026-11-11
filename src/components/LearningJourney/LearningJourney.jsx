import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { getPdfDownloadUrl, getPastPaperDownloadUrl } from '../../api/client';
import { getCurriculumNode } from '../../api/curriculumNavigation';
import { isPremiumAccessError, redirectToSubscription } from '../../utils/subscriptionNavigation';
import { buildLearningStages } from '../../utils/learningJourney';
import './LearningJourney.css';

const journeyCache = new Map();

export default function LearningJourney({
  unitId,
  noteId = null,
  internalLinks = null,
  linkedContent: suppliedLinkedContent,
  nodeName = '',
  nodeType = '',
  returnTo = '',
  excludeStages = []
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
    excludeStages
  }), [source, noteId, internalLinks, unitId, nodeType, returnTo, excludeStages]);

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
      <section className="learning-journey" aria-live="polite">
        <div className="learning-journey-heading">
          <span className="learning-journey-eyebrow">Keep learning</span>
          <h2>Finding your next steps</h2>
          <p>Connecting the reading, revision and practice materials for this learning area.</p>
        </div>
        <div className="learning-journey-loading" />
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

      <div className="learning-journey-flow">
        {stages.map((stage, index) => (
          <section className="learning-journey-stage" key={stage.key} aria-labelledby={'learning-journey-' + stage.key}>
            <div className="learning-journey-stage-marker" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="learning-journey-stage-content">
              <div className="learning-journey-stage-heading">
                <span className="learning-journey-stage-icon"><Icon name={stage.meta.icon} /></span>
                <div>
                  <span className="learning-journey-stage-step">Stage {String(index + 1).padStart(2, '0')}</span>
                  <h3 id={'learning-journey-' + stage.key}>{stage.meta.title}</h3>
                  <p>{stage.meta.description}</p>
                </div>
                <span className="learning-journey-stage-count">{stage.items.length} {stage.items.length === 1 ? 'resource' : 'resources'}</span>
              </div>

              <div className="learning-journey-items">
                {stage.items.map((item) => {
                  const content = (
                    <>
                      <span className="learning-journey-item-copy">
                        <strong>{item.title}</strong>
                        {item.detail && <small>{item.detail}</small>}
                        {item.preview && <small>{item.preview}</small>}
                      </span>
                      <span className="learning-journey-item-action">
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
                      className="learning-journey-item"
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

      {actionError && <p className="learning-journey-error" role="alert">{actionError}</p>}
    </section>
  );
}
