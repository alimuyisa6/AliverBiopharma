import { useEffect, useState } from 'react';
import { getAd, recordAdClick } from '../../api/client';
import { useLevelFilter } from '../../hooks/useLevelFilter';
import Icon from '../Icon/Icon';
import Spinner from '../Spinner/Spinner';

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

  useEffect(() => {
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
  }, [placement, pageContext, level, class_name]);

  if (loading) {
    return (
      <div className={`ad-slot ad-slot-loading ${className}`} aria-label={label}>
        <Spinner size="sm" context="brand" />
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

      <a
        href={ad.landing_url}
        className="ad-slot-card"
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
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
          <span className="ad-slot-cta">
            {ad.cta_text || 'Learn more'}
            <Icon name="arrow-right" aria-hidden="true" />
          </span>
        </div>
      </a>
    </aside>
  );
}
