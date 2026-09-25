import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import { getDonateConfig, getDonors, submitMomoDonation } from '../api/client';
import '../styles/donate.css';

const DEFAULT_GOAL = 500000;

function formatAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : '0';
}

export default function Donate() {
  const [tab, setTab] = useState('crypto');
  const [config, setConfig] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(true);
  const [form, setForm] = useState({ name: '', amount: '', txid: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState('');

  const loadDonors = useCallback(async () => {
    setDonorsLoading(true);
    try {
      setDonors(await getDonors());
    } catch {
      setDonors([]);
    } finally {
      setDonorsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getDonateConfig();
        if (mounted) setConfig(data || {});
      } catch {
        if (mounted) setConfig({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    loadDonors();
    return () => { mounted = false; };
  }, [loadDonors]);

  const goal = Number(config?.goal_amount) || DEFAULT_GOAL;
  const raised = Number(config?.raised_amount) || 0;
  const percentage = Math.min(Math.round((raised / goal) * 100), 100);
  const momo = config?.momo || {};
  const cryptoKey = config?.nowpayments_api_key || '';

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status) setStatus(null);
  };

  const copyNumber = async (provider, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(provider);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setStatus({ type: 'error', message: 'Unable to copy the number on this device.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim().slice(0, 100);
    const amount = form.amount.trim();
    const txid = form.txid.trim().slice(0, 100);

    if (!amount || !txid || Number(amount) <= 0) {
      setStatus({ type: 'error', message: 'Amount and Transaction ID are required.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      await submitMomoDonation({
        name: name || 'Anonymous',
        amount,
        txid,
      });

      setForm({ name: '', amount: '', txid: '' });
      setStatus({
        type: 'success',
        message: 'Thank you. Your donation has been submitted for confirmation.',
      });
      await loadDonors();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to submit the donation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const heroStyle = useMemo(
    () => config?.background_image
      ? { backgroundImage: `url("${config.background_image}")` }
      : undefined,
    [config?.background_image]
  );

  if (loading) {
    return (
      <main className="donate-page">
        <div className="donate-loading">
          <span className="spinner spinner-brand spinner-lg" aria-label="Loading donations" />
        </div>
      </main>
    );
  }

  return (
    <main className="donate-page">
      <section className="donate-hero" style={heroStyle}>
        <div className="donate-hero-overlay" />
        <div className="donate-hero-content">
          <span className="eyebrow">Support AliverBiopharm</span>
          <h1>{config?.title || 'Support Our Mission'}</h1>
          <p>{config?.subtitle || 'Help keep biology and pharmacy education free and accessible.'}</p>
        </div>
      </section>

      <div className="donate-content">
        <section className="donate-goal" aria-label="Donation progress">
          <div className="donate-goal-label">
            <span>Monthly Goal</span>
            <strong>{percentage}%</strong>
          </div>
          <div className="donate-goal-track">
            <div className="donate-goal-fill" style={{ width: `${percentage}%` }} />
          </div>
          <div className="donate-goal-label donate-goal-values">
            <span>UGX {formatAmount(raised)}</span>
            <span>UGX {formatAmount(goal)}</span>
          </div>
        </section>

        <div className="donate-tabs" role="tablist" aria-label="Donation methods">
          <button
            type="button"
            className={`donate-tab ${tab === 'crypto' ? 'is-active' : ''}`}
            onClick={() => setTab('crypto')}
            role="tab"
            aria-selected={tab === 'crypto'}
          >
            <Icon name="credit-card" />
            Cryptocurrency
          </button>
          <button
            type="button"
            className={`donate-tab ${tab === 'momo' ? 'is-active' : ''}`}
            onClick={() => setTab('momo')}
            role="tab"
            aria-selected={tab === 'momo'}
          >
            <Icon name="credit-card" />
            Mobile Money
          </button>
        </div>

        {tab === 'crypto' && (
          <section className="donate-card" aria-labelledby="crypto-title">
            <div className="donate-card-heading">
              <Icon name="credit-card" />
              <h2 id="crypto-title">Donate with Cryptocurrency</h2>
            </div>
            <p className="donate-muted donate-center">Choose your preferred method below.</p>

            {cryptoKey ? (
              <>
                <div className="donate-widget">
                  <iframe
                    title="Cryptocurrency donation widget"
                    src={`https://nowpayments.io/embeds/donation-widget?api_key=${encodeURIComponent(cryptoKey)}`}
                    loading="lazy"
                    scrolling="no"
                  />
                </div>
                <div className="donate-button-wrap">
                  <a
                    href={`https://nowpayments.io/donation?api_key=${encodeURIComponent(cryptoKey)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="donate-external-button"
                  >
                    Open Crypto Donation
                  </a>
                </div>
              </>
            ) : (
              <div className="donate-unavailable">
                <Icon name="circle-info" />
                <p>Cryptocurrency donations are being configured. Please use Mobile Money for now.</p>
              </div>
            )}
          </section>
        )}

        {tab === 'momo' && (
          <section className="donate-card" aria-labelledby="momo-title">
            <div className="donate-card-heading">
              <Icon name="credit-card" />
              <h2 id="momo-title">Mobile Money</h2>
            </div>

            <div className="donate-momo-grid">
              {momo.mtn?.number && (
                <article className="donate-momo-card">
                  <div className="donate-momo-logo donate-mtn">MTN</div>
                  <strong>{momo.mtn.number}</strong>
                  <span>{momo.mtn.name || 'MTN Mobile Money'}</span>
                  <button type="button" className="donate-copy" onClick={() => copyNumber('mtn', momo.mtn.number)}>
                    <Icon name={copied === 'mtn' ? 'check' : 'copy'} />
                    {copied === 'mtn' ? 'Copied' : 'Copy'}
                  </button>
                </article>
              )}

              {momo.airtel?.number && (
                <article className="donate-momo-card">
                  <div className="donate-momo-logo donate-airtel">airtel</div>
                  <strong>{momo.airtel.number}</strong>
                  <span>{momo.airtel.name || 'Airtel Money'}</span>
                  <button type="button" className="donate-copy" onClick={() => copyNumber('airtel', momo.airtel.number)}>
                    <Icon name={copied === 'airtel' ? 'check' : 'copy'} />
                    {copied === 'airtel' ? 'Copied' : 'Copy'}
                  </button>
                </article>
              )}
            </div>

            <form className="donate-form" onSubmit={handleSubmit}>
              <p className="donate-muted">After sending, enter your transaction details so the donation can be verified.</p>

              <div className="donate-form-grid">
                <label>
                  <span>Name <em>optional</em></span>
                  <input value={form.name} onChange={(e) => updateField('name', e.target.value)} maxLength={100} placeholder="Your name" />
                </label>
                <label>
                  <span>Amount (UGX) *</span>
                  <input type="number" min="1" inputMode="numeric" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} placeholder="e.g. 10000" required />
                </label>
                <label>
                  <span>Transaction ID *</span>
                  <input value={form.txid} onChange={(e) => updateField('txid', e.target.value)} maxLength={100} placeholder="From your Mobile Money SMS" required />
                </label>
              </div>

              <button type="submit" className="btn btn-primary donate-submit" disabled={submitting}>
                <Icon name={submitting ? 'clock' : 'paper-plane'} />
                {submitting ? 'Submitting...' : 'Confirm Donation'}
              </button>

              {status && (
                <p className={`donate-status donate-status-${status.type}`} role="status">
                  {status.message}
                </p>
              )}
            </form>
          </section>
        )}

        <section className="donate-card" aria-labelledby="supporters-title">
          <div className="donate-card-heading">
            <Icon name="heart" />
            <h2 id="supporters-title">Recent Supporters</h2>
          </div>

          <div className="donor-list">
            {donorsLoading && <p className="donate-muted donate-center">Loading supporters...</p>}
            {!donorsLoading && donors.length === 0 && (
              <p className="donate-muted donate-center">Be the first supporter.</p>
            )}
            {!donorsLoading && donors.map((donor, index) => (
              <div className="donor-row" key={donor.id || `${donor.name}-${donor.date}-${index}`}>
                <span className="donor-avatar">{(donor.name || 'A').charAt(0).toUpperCase()}</span>
                <span className="donor-info">
                  <strong>{donor.name || 'Anonymous'}</strong>
                  <small>{donor.date || ''}</small>
                </span>
                <strong className="donor-amount">UGX {formatAmount(donor.amount)}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="donate-return">
          <Link to="/" className="btn btn-secondary">
            <Icon name="arrow-left" />
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
