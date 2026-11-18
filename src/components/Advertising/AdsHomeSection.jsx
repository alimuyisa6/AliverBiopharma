import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';

export default function AdsHomeSection() {
  return (
    <section className="w-full overflow-hidden bg-primary-900 px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-12" aria-labelledby="ads-home-title">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 rounded-[2rem] border border-white/15 bg-white/5 p-6 shadow-xl backdrop-blur-sm sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:p-12">
        <div className="min-w-0">
          <span className="mb-4 inline-flex rounded-full border border-secondary-300/40 bg-secondary-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-orange-200">For education partners</span>
          <h2 id="ads-home-title" className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Advertising that reaches <span className="text-orange-300">the right learners.</span>
          </h2>
          <div className="mt-5 grid max-w-3xl gap-3 text-sm leading-7 text-blue-100 sm:text-base">
            <p>AliverBiopharm connects advertisers with learners studying Biology and Pharmacy. Campaigns can be targeted by learning level, class or programme.</p>
            <p>From scholarships and training opportunities to healthcare initiatives and educational resources, your message reaches an audience that's already engaged in learning.</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col items-start gap-3 lg:w-auto lg:items-end">
          <Link to="/advertise" className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-secondary-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-secondary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto">
            <span>Place Your Ad</span><Icon name="arrow-right" className="h-5 w-5" />
          </Link>
          <span className="text-xs text-blue-200">Reach learners with relevant opportunities.</span>
        </div>
      </div>
    </section>
  );
}
