import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import StorysetIllustration from '../../components/StorysetIllustration';

export function NewsletterForm({ email, status, loading = false, onChange, onSubmit }) {
  return (
    <section className="w-full bg-primary-900 px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12" aria-labelledby="lernwick-newsletter-title">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur sm:p-9 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:p-12">
        <div className="flex max-w-2xl items-center gap-5">
          <div className="min-w-0 flex-1">
            <h2 id="lernwick-newsletter-title" className="text-3xl font-bold leading-tight text-white sm:text-4xl">Keep growing your knowledge.</h2>
            <p className="mt-8 text-base leading-8 text-blue-100">Receive updates about new Biology and Pharmacy learning resources, study tools and platform opportunities.</p>
          </div>
          <StorysetIllustration name="emailCampaign" alt="Email updates and newsletter" className="hidden w-36 shrink-0 object-contain sm:block lg:w-44" />
        </div>
        <form onSubmit={onSubmit} className="min-w-0 rounded-2xl border border-white/15 bg-white p-5 text-slate-800 shadow-lg sm:p-6" aria-label="Subscribe to AliverBiopharm updates">
          <label htmlFor="lernwick-newsletter-email" className="mb-3 block text-sm font-bold text-primary-900">Get learning updates in your inbox</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input id="lernwick-newsletter-email" className="min-w-0 flex-1" type="email" placeholder="Enter your email address" value={email} onChange={onChange} required aria-label="Email address" />
            <Button className="shrink-0" type="submit" loading={loading} loadingContext="brand" loadingLabel="Subscribing…">Subscribe</Button>
          </div>
          {status && <p className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${status.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`} role="status" aria-live="polite">{status.message}</p>}
        </form>
      </div>
    </section>
  );
}
