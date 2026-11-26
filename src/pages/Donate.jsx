import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import Button from '../components/Button/Button';
import { UI } from '../design-system';
import StorysetIllustration from '../components/StorysetIllustration';
import Spinner from '../components/Spinner/Spinner';
import { getDonateConfig, getDonors, submitMomoDonation } from '../api/client';
import { DEFAULT_DONATION_GOAL, formatDonationAmount, calculateDonationPercentage } from '../utils/donationFormatting';

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

  const goal = Number(config?.goal_amount) || DEFAULT_DONATION_GOAL;
  const raised = Number(config?.raised_amount) || 0;
  const percentage = calculateDonationPercentage(raised, goal);
  const momo = config?.momo || {};
  const cryptoAvailable = Boolean(config?.crypto_available);

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
      setStatus({ type: 'error', message: 'We couldn’t copy the number on this device. Please copy it manually.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim().slice(0, 100);
    const amount = form.amount.trim();
    const txid = form.txid.trim().slice(0, 100);

    if (!amount || !txid || Number(amount) <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid amount and your transaction ID.' });
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
        message: 'Thank you. Your donation details have been submitted for verification.',
      });
      await loadDonors();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'We couldn’t submit your donation details. Please try again.' });
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
      <main className="min-h-screen bg-primary-50">
        <div className="flex min-h-[55vh] items-center justify-center"><Spinner size="lg" /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-primary-50 pb-10">
      <section className="relative isolate overflow-hidden bg-primary-900 bg-cover bg-[center_48%] text-white max-md:bg-[60%_center] bg-[url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6')] px-5 py-14 sm:py-20" style={heroStyle}>
        <div className="absolute inset-0 -z-0 bg-primary-900/85" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-4xl justify-items-center gap-4 text-center">
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{config?.title || 'Help learners study Biology and Pharmacy'}</h1>
          <StorysetIllustration name="achievement" alt="Learners celebrating educational progress" className="mx-auto my-2 w-full max-w-[180px] object-contain" />
          <p className="max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">{config?.subtitle || 'Your contribution helps us improve access to Biology and Pharmacy learning materials.'}</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 pt-7 sm:px-6 sm:pt-10">
        <section className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm sm:p-6" aria-label="Monthly donation progress">
          <div className="flex flex-wrap items-center justify-between gap-3 font-semibold text-primary-900">
            <span>Monthly support goal</span><strong>{percentage}%</strong>
          </div>
          <div className="my-3 h-4 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary-600 transition-[width] duration-700" style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-muted">
            <span>UGX {formatDonationAmount(raised)}</span><span>UGX {formatDonationAmount(goal)}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm" role="tablist" aria-label="Donation methods">
          <button type="button" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === 'crypto' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800'}`} onClick={() => setTab('crypto')} role="tab" aria-selected={tab === 'crypto'}>
            <Icon name="bitcoin" /> Cryptocurrency
          </button>
          <button type="button" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === 'momo' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800'}`} onClick={() => setTab('momo')} role="tab" aria-selected={tab === 'momo'}>
            <Icon name="mobile-money" /> Mobile Money
          </button>
        </div>

        {tab === 'crypto' && (
          <section className="grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6" aria-labelledby="crypto-title">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
              <Icon name="bitcoin" className="h-8 w-8 rounded-xl bg-primary-50 p-1.5 text-primary-700" />
              <h2 id="crypto-title" className="text-xl font-bold text-primary-900">Donate with cryptocurrency</h2>
            </div>
            <p className="text-center text-sm text-muted">Choose a donation method.</p>
            {cryptoAvailable ? (
              <div className="grid justify-items-center gap-3 rounded-xl bg-primary-50 p-5 text-center">
                <Icon name="circle-info" />
                <p className="text-sm leading-6 text-slate-700">Cryptocurrency checkout is available for premium subscriptions from your Profile Billing section.</p>
                <Link to="/profile?section=billing" className={UI.primaryButton}>View subscription plans</Link>
              </div>
            ) : (
              <div className="grid justify-items-center gap-3 rounded-xl bg-primary-50 p-5 text-center">
                <Icon name="circle-info" />
                <p className="text-sm leading-6 text-slate-700">Cryptocurrency payments are being configured. You can currently support AliverBiopharm through Mobile Money.</p>
              </div>
            )}
          </section>
        )}

        {tab === 'momo' && (
          <section className="grid gap-5 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6" aria-labelledby="momo-title">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
              <Icon name="mobile-money" className="h-8 w-8 rounded-xl bg-primary-50 p-1.5 text-primary-700" />
              <h2 id="momo-title" className="text-xl font-bold text-primary-900">Mobile Money</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {momo.mtn?.number && (
                <article className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-slate-50 p-5 text-center">
                  <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-xl bg-primary-900 px-4 text-lg font-extrabold text-white">MTN</div>
                  <strong className="break-all text-lg font-extrabold text-primary-900">{momo.mtn.number}</strong>
                  <span className="text-sm text-muted">{momo.mtn.name || 'MTN Mobile Money'}</span>
                  <button type="button" className={UI.primaryButton} onClick={() => copyNumber('mtn', momo.mtn.number)}><Icon name={copied === 'mtn' ? 'check' : 'copy'} />{copied === 'mtn' ? 'Copied' : 'Copy'}</button>
                </article>
              )}
              {momo.airtel?.number && (
                <article className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-slate-50 p-5 text-center">
                  <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-xl bg-secondary-500 px-4 text-lg font-extrabold text-white">airtel</div>
                  <strong className="break-all text-lg font-extrabold text-primary-900">{momo.airtel.number}</strong>
                  <span className="text-sm text-muted">{momo.airtel.name || 'Airtel Money'}</span>
                  <button type="button" className={UI.primaryButton} onClick={() => copyNumber('airtel', momo.airtel.number)}><Icon name={copied === 'airtel' ? 'check' : 'copy'} />{copied === 'airtel' ? 'Copied' : 'Copy'}</button>
                </article>
              )}
            </div>

            <form className="mt-2 grid gap-4 rounded-2xl bg-primary-50 p-4 sm:p-5" onSubmit={handleSubmit}>
              <p className="text-sm leading-6 text-muted">After sending your donation, enter the transaction ID and amount so our team can verify the payment.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                  <span>Name <em className="font-normal text-muted">optional</em></span>
                  <input value={form.name} onChange={(e) => updateField('name', e.target.value)} maxLength={100} placeholder="Your name" className={UI.inputBase} />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                  <span>Amount (UGX) *</span>
                  <input type="number" min="1" inputMode="numeric" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} placeholder="e.g. 10000" required className={UI.inputBase} />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                  <span>Transaction ID *</span>
                  <input value={form.txid} onChange={(e) => updateField('txid', e.target.value)} maxLength={100} placeholder="Enter the transaction ID from your Mobile Money confirmation message" required className={UI.inputBase} />
                </label>
              </div>
              <Button type="submit" icon="paper-plane" loading={submitting} loadingLabel="Submitting…" disabled={submitting}>Submit donation</Button>
              {status && <p className={status.type === 'success' ? UI.status.success : UI.status.error} role="status">{status.message}</p>}
            </form>
          </section>
        )}

        <section className="grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
            <Icon name="heart" className="h-8 w-8 rounded-xl bg-primary-50 p-1.5 text-primary-700" />
            <h2 className="text-xl font-bold text-primary-900">Recent supporters</h2>
          </div>
          <div className="grid gap-1">
            {donorsLoading && <p className="py-4 text-center text-sm text-muted">Loading supporters…</p>}
            {!donorsLoading && donors.length === 0 && <p className="py-4 text-center text-sm text-muted">Be the first to support our work.</p>}
            {!donorsLoading && donors.map((donor, index) => (
              <div className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0" key={donor.id || `${donor.name}-${donor.date}-${index}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-800">{(donor.name || 'A').charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><strong className="block break-words text-sm text-slate-800">{donor.name || 'Anonymous'}</strong><small className="text-xs text-muted">{donor.date || ''}</small></span>
                <strong className="shrink-0 text-sm font-bold text-emerald-700">UGX {formatDonationAmount(donor.amount)}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <Link to="/" className={UI.secondaryButton}><Icon name="arrow-left" /> Return home</Link>
        </div>
      </div>
    </main>
  );
}
