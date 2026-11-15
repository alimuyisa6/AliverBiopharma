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
      <div ref={slotRef} className={`ad-slot ad-slot-loading ${className}`} aria-label={label} aria-busy="true">
        <span className="page-skeleton__bar page-skeleton__bar--medium" />
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
    <aside className={`ad-slot ${className}`} aria-label={label}>
      <div className="ad-slot-label">
        <Icon name="bullhorn" aria-hidden="true" />
        <span>{label}</span>
      </div>

      <article className="ad-slot-card">
        {ad.image_url && (
          <div className="ad-slot-media">
            <img
              src={ad.image_url}
              alt={ad.headline}
              loading="lazy"
            />
          </div>
        )}

        <div className="ad-slot-content">
          {ad.advertiser_name && (
            <span className="ad-slot-advertiser">{ad.advertiser_name}</span>
          )}
          <h2 className="ad-slot-headline">{ad.headline}</h2>
          {ad.body_text && (
            <p className="ad-slot-body">{ad.body_text}</p>
          )}
          <a
            href={ad.landing_url}
            className="ad-slot-cta"
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
