import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import StorysetIllustration from '../StorysetIllustration';

export default function AdsHomeSection() {
  return (
    <section className="w-full overflow-hidden bg-secondary-50 px-5 py-14 text-primary-900 sm:px-8 sm:py-20 lg:px-12" aria-labelledby="ads-home-title">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 rounded-[2rem] border border-secondary-200 bg-white p-6 shadow-sm sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:p-12">
        <div className="min-w-0">
          
          <h2 id="ads-home-title" className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
            Advertising that reaches <span className="text-secondary-700">the right learners.</span>
          </h2>
          <div className="mt-5 grid max-w-3xl gap-3 text-sm leading-7 text-slate-600 sm:text-base">
            <p>AliverBiopharm connects advertisers with learners studying Biology and Pharmacy. Campaigns can be targeted by learning level, class or programme.</p>
            <p>From scholarships and training opportunities to healthcare initiatives and educational resources, your message reaches an audience that's already engaged in learning.</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col items-start gap-3 lg:w-auto lg:items-end">
          <StorysetIllustration name="marketing" alt="Education advertising and campaign illustration" className="w-full max-w-[300px] object-contain" />
          <Link to="/advertise" className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 sm:w-auto">
            <span>Place Your Ad</span><Icon name="arrow-right" className="h-5 w-5" />
          </Link>
          <span className="mt-8 block text-xs text-slate-500">Reach learners with relevant opportunities.</span>
        </div>
      </div>
    </section>
  );
}
