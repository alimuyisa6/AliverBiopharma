 import { useEffect, useState } from 'react';
import { getInfoSection } from '../api/client';
import { getCachedStale } from '../utils/cache';
import { Link } from 'react-router-dom';
import { Icon, getIconNameFromClass } from '../design-system.jsx';

function RichText({ text }) {
  const TOKEN_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})|((https?:\/\/)[^\s<>"']+)/g;
  const parts = [];
  let last = 0;
  let match;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    const isEmail = !!match[1];
    parts.push(
      <a
        key={match.index}
        href={isEmail ? `mailto:${raw}` : raw}
        target={isEmail ? undefined : '_blank'}
        rel={isEmail ? undefined : 'noopener noreferrer'}
        className="font-semibold text-primary-700 underline underline-offset-4 hover:text-primary-900"
      >
        {raw}
      </a>
    );
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function TeamCard({ member }) {
  const socialIcons = { linkedin: 'linkedinBrand', twitter: 'xBrand', instagram: 'instagramBrand', website: 'websiteBrand' };
  return (
    <article className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="aspect-[4/3] overflow-hidden bg-primary-50">
        <img src={member.image_url || '/placeholder-avatar.svg'} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="grid content-start gap-2 p-4 sm:p-5">
        <h3 className="text-lg font-extrabold text-primary-950">{member.name}</h3>
        <p className="text-sm font-bold text-secondary-700">{member.role}</p>
        {member.bio && <p className="text-sm leading-7 text-slate-700">{member.bio}</p>}
        {member.social && <div className="mt-2 flex flex-wrap gap-2">{Object.entries(member.social).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={platform} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-primary-700 transition hover:border-primary-300 hover:bg-primary-50"><Icon name={socialIcons[platform] || 'websiteBrand'} size={16} /></a>)}</div>}
      </div>
    </article>
  );
}

function ContributorCard({ contributor }) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white p-4">
      <img src={contributor.image_url || '/placeholder-avatar.svg'} alt={contributor.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-full bg-primary-50 object-cover" />
      <div className="min-w-0"><strong className="block break-words text-sm font-bold text-primary-950">{contributor.name}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{contributor.role}</span></div>
    </article>
  );
}

export default function AboutPage() {
  const [page, setPage] = useState(() => getCachedStale('site_sections')?.about || null);

  useEffect(() => {
    let active = true;
    getInfoSection('about')
      .then((data) => {
        if (active) setPage(data?.about || data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!page) {
    return (
      <section className="w-full bg-background px-5 py-16" aria-busy="true">
        <div className="mx-auto grid w-full max-w-5xl gap-5">
          <div className="h-12 max-w-xl animate-pulse rounded-xl bg-slate-200" />
          <div className="h-5 w-full animate-pulse rounded-lg bg-slate-200" />
          <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </section>
    );
  }

  return (
    <>
      {page?.hero && (
        <section
          className="relative isolate flex min-h-[420px] w-full items-center overflow-hidden bg-primary-900 bg-cover bg-[center_42%] text-white max-md:bg-[60%_center] bg-[url('https://images.unsplash.com/photo-1579154204601-01588f351e67')]"
          style={page.hero.image_url ? {
            backgroundImage: `url(${page.hero.image_url})`,
          } : undefined}
        >
          <div className="absolute inset-0 -z-0 bg-primary-900/90" aria-hidden="true" />
          <div className="absolute inset-0 -z-0 bg-primary-900/30" aria-hidden="true" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 sm:py-28">
            
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl">{page.hero.heading || page.title}</h1>
            {page.hero.subtext && <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-xl">{page.hero.subtext}</p>}
          </div>
        </section>
      )}

      <section className="w-full bg-primary-100 px-5 py-14 text-slate-800 sm:py-20">
        <div className="mx-auto grid w-full max-w-5xl gap-8 sm:gap-10">
          {!page?.hero && (
            <h1 className="mb-10 text-4xl font-extrabold text-primary-900 sm:text-5xl">{page?.title || 'About AliverBiopharm'}</h1>
          )}

          {page?.mission && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.mission.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.mission.heading}</h2>}
              {page.mission.content.split('\n\n').map((para, i) => (
                <p key={i} className="text-base leading-8 text-slate-800 sm:text-[1.0625rem]"><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.vision && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.vision.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.vision.heading}</h2>}
              {page.vision.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.story && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.story.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.story.heading}</h2>}
              {page.story.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.why_choose_us && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.why_choose_us.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.why_choose_us.heading}</h2>}
              {page.why_choose_us.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.learning_philosophy && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.learning_philosophy.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.learning_philosophy.heading}</h2>}
              {page.learning_philosophy.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.founders && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.founders.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.founders.heading}</h2>}
              {page.founders.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.values && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.values.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.values.heading}</h2>}
              {page.values.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.team?.length > 0 && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              <div className="mb-5"><h2 className="text-2xl font-bold text-primary-900 sm:text-3xl">{page.team_heading || 'Meet our team'}</h2></div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {page.team.map((member, idx) => (
                  <TeamCard key={idx} member={member} />
                ))}
              </div>
            </div>
          )}

          {page?.contributors?.length > 0 && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.contributors_heading || 'Content contributors and reviewers'}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {page.contributors.map((contributor, idx) => (
                  <ContributorCard key={idx} contributor={contributor} />
                ))}
              </div>
            </div>
          )}

          {page?.commitment_to_quality && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.commitment_to_quality.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.commitment_to_quality.heading}</h2>}
              {page.commitment_to_quality.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.future && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.future.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.future.heading}</h2>}
              {page.future.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.legal && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.legal.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.legal.heading}</h2>}
              {page.legal.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.faq && (
            <div className="grid gap-4 border-b border-border pb-8 last:border-0">
              {page.faq.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.faq.heading}</h2>}
              <div className="grid gap-3">
                {(page.faq.questions || []).map((item, idx) => (
                  <details key={idx} className="group rounded-2xl border border-border bg-white p-5 transition-shadow open:border-primary-300 open:shadow-sm sm:p-6">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-bold leading-7 text-slate-900 marker:hidden sm:text-lg [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition-transform group-open:rotate-180" aria-hidden="true">
                        <Icon name="chevronDown" size={18} />
                      </span>
                    </summary>
                    <div className="mt-4 border-t border-slate-300 pt-4 text-base leading-7 text-slate-800">
                      <RichText text={item.answer} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {page?.contact && (
            <section className="grid gap-4 rounded-2xl bg-secondary-50 p-6 sm:p-8">
              {page.contact.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.contact.heading}</h2>}
              {page.contact.subtext && <p className="max-w-3xl text-base leading-7 text-slate-800"><RichText text={page.contact.subtext} /></p>}
              <div className="flex flex-wrap gap-3">
                {page.contact.email && (
                  <a href={`mailto:${page.contact.email}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-900 no-underline">
                    <Icon name="emailBrand" size={16} /> {page.contact.email}
                  </a>
                )}
                {page.contact.phone && (
                  <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-900 no-underline">
                    <Icon name="phone" size={16} /> {page.contact.phone}
                  </div>
                )}
                {page.contact.address && (
                  <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-900 no-underline">
                    <Icon name="locationPin" size={16} /> {page.contact.address}
                  </div>
                )}
              </div>
              {page.contact.social_links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {page.contact.social_links.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-secondary-200 bg-white text-primary-800 transition hover:bg-secondary-100">
                      <Icon name={getIconNameFromClass(s.icon)} size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {page?.call_to_action && (
            <section className="grid gap-4 rounded-3xl bg-primary-900 p-6 text-white sm:p-8">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{page.call_to_action.heading || 'Start learning with AliverBiopharm'}</h2>
              {page.call_to_action.content && <p className="max-w-3xl text-sm leading-7 text-blue-100"><RichText text={page.call_to_action.content} /></p>}
              {page.call_to_action.button_text && (
                <Link
                  to={page.call_to_action.button_url || '/register'}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-primary-900 transition hover:bg-primary-50"
                >
                  {page.call_to_action.button_text}
                </Link>
              )}
            </section>
          )}
        </div>
      </section>
    </>
  );
}
