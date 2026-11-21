import { useEffect, useRef, useState } from 'react';
import { getAd, recordAdClick } from '../../api/client';
import { useLevelFilter } from '../../hooks/useLevelFilter';
import Icon from '../Icon/Icon';

const FINGERPRINT_KEY = 'aliverbiopharm_ad_session';

function getSessionFingerprint() {
  try {
    const existing = window.localStorage.getItem(FINGERPRINT_KEY);
    if (existing) return existing;

    const value = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `ad_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(FINGERPRINT_KEY, value);
    return value;
  } catch {
    return `ad_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export default function AdSlot({
  placement,
  pageContext = '',
  className = '',
  label = 'Advertisement',
}) {
  const { level, class_name } = useLevelFilter();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(false);
  const slotRef = useRef(null);

  useEffect(() => {
    const node = slotRef.current;
    if (!node) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: '700px 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return undefined;
    let active = true;
    const fingerprint = getSessionFingerprint();

    setLoading(true);
    setAd(null);

    getAd(placement, fingerprint, {
      levelId: level || '',
      className: class_name || '',
      pageContext,
    })
      .then((result) => {
        if (active) setAd(result || null);
      })
      .catch(() => {
        if (active) setAd(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shouldLoad, placement, pageContext, level, class_name]);

  if (!shouldLoad || loading) {
    return (
      <div ref={slotRef} className={`mx-auto my-6 w-full max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`} aria-label={label} aria-busy="true">
        <span className="block h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (!ad?.landing_url || !ad?.headline) return null;

  const handleClick = async (event) => {
    event.preventDefault();

    try {
      await recordAdClick(ad.impression_id);
    } catch {
      // A failed analytics call must not prevent the learner from reaching the advertiser.
    } finally {
      window.location.assign(ad.landing_url);
    }
  };

  return (
    <aside className={`mx-auto my-6 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} aria-label={label}>
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Icon name="bullhorn" aria-hidden="true" />
        <span>{label}</span>
      </div>

      <article className="grid min-w-0 overflow-hidden sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        {ad.image_url && (
          <div className="min-h-40 overflow-hidden bg-slate-100 sm:min-h-full">
            <img
              src={ad.image_url}
              alt={ad.headline}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex min-w-0 flex-col items-start gap-3 p-5 sm:p-6">
          {ad.advertiser_name && (
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">{ad.advertiser_name}</span>
          )}
          <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{ad.headline}</h2>
          {ad.body_text && (
            <p className="text-sm leading-6 text-slate-600">{ad.body_text}</p>
          )}
          <a
            href={ad.landing_url}
            className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {ad.cta_text || 'Learn more'}
            <Icon name="arrow-right" aria-hidden="true" />
          </a>
        </div>
      </article>
    </aside>
  );
}
