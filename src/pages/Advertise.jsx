/* src/pages/Advertise.jsx */
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import { useLayout } from '../contexts/LayoutContext';

const BENEFITS = [
  {
    icon: 'audience',
    title: 'Relevant learners',
    description: 'Target learners by Biology level, school class, and Pharmacy programme.',
  },
  {
    icon: 'campaign',
    title: 'Clear campaigns',
    description: 'Present your offer with a clear headline and campaign artwork.',
  },
  {
    icon: 'review',
    title: 'Responsible advertising',
    description: 'Every campaign is checked before it appears to learners.',
  },
];

const PROGRAMMES = [
  {
    title: 'Biology O-Level',
    description: 'Students studying O-Level Biology in Forms 1–4.',
  },
  {
    title: 'Biology A-Level',
    description: 'Students studying A-Level Biology in Forms 5–6.',
  },
  {
    title: 'Pharmacy',
    description: 'Students enrolled in Pharmacy Certificate, Diploma, and Degree programmes.',
  },
];

export default function Advertise() {
  const { bootstrap } = useLayout();
  const uiComponents = bootstrap?.ui_components || [];
  const component = uiComponents.find((item) => item.component_key === 'advertise_hero');
  const imageUrl = component?.properties?.image_url || '/images/advertise-hero.jpg';
  const imageAlt = component?.properties?.image_alt || 'Reach relevant learners through AliverBiopharm advertising';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,166,0.75),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-secondary-200/40 bg-secondary-400/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-100">Advertise with AliverBiopharm</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">Reach learners who are ready to discover opportunities.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">Introduce your organisation to learners studying Biology and Pharmacy.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#start" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-700 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start your campaign <Icon name="arrow-right" /></a>
              <a href="#how-it-works" className="inline-flex min-h-11 items-center font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:text-orange-100">See how it works</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-secondary-400/20 blur-2xl" aria-hidden="true" />
            <img className="relative aspect-[5/4] w-full rounded-[1.75rem] border border-white/20 object-cover shadow-2xl" src={imageUrl} alt={imageAlt} />
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-white/20 bg-white/95 p-4 text-primary-900 shadow-xl sm:left-8 sm:right-8">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><AdStepIcon name="audience" size={24} /></span><div><strong className="block text-sm font-bold">A focused learning audience</strong><span className="text-xs text-slate-600">Biology and Pharmacy learners</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20" style={{ backgroundColor: '#E8F4F2' }} aria-labelledby="advertise-programmes-title">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">Reach the right learners</span>
            <h2 id="advertise-programmes-title" className="mt-3 text-3xl font-extrabold text-primary-900 sm:text-4xl">Reach learners where they study.</h2>
            <p className="mt-4 text-base text-slate-600">Select the learner group you want your campaign to reach.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROGRAMMES.map((programme,index)=><article className="flex gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-6 transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg" key={programme.title}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-sm font-extrabold text-white">{String(index+1).padStart(2,'0')}</span>
              <div><h3 className="text-lg font-bold text-primary-900">{programme.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{programme.description}</p></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20" style={{ backgroundColor: '#F1EDFA' }} id="how-it-works" aria-labelledby="advertise-benefits-title">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">Why advertise here</span>
            <h2 id="advertise-benefits-title" className="mt-3 text-3xl font-extrabold text-primary-900 sm:text-4xl">Reach the right learners, with a relevant message.</h2>
            <p className="mt-4 text-base text-slate-600">Show learners opportunities that match their studies and career goals.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {BENEFITS.map(benefit=><article className="rounded-2xl border border-border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={benefit.title}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700"><AdStepIcon name={benefit.icon} size={28} /></div>
              <h3 className="mt-5 text-xl font-bold text-primary-900">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20" style={{ backgroundColor: '#F8F1E7' }} id="start">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">Ready when you are</span>
            <h2 className="mt-3 text-3xl font-extrabold text-primary-900 sm:text-4xl">Set up your campaign in a few steps.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Select your audience and ad placement, enter your campaign details, then submit it for review.</p>
            <Link to="/advertise/create" className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-secondary-500 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-secondary-600">Create campaign <Icon name="arrow-right" /></Link>
          </div>
          <div className="flex gap-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><AdStepIcon name="review" size={34} /></span>
            <div><h3 className="text-lg font-bold text-white">Reviewed before it goes live</h3><p className="mt-2 text-sm leading-7 text-blue-100">We check each campaign for accuracy and relevance before it appears on the site.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
