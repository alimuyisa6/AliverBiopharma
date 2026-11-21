 import { useEffect, useState } from 'react';
import { getInfoSection } from '../api/client';
import { getCachedStale } from '../utils/cache';
import { Link } from 'react-router-dom';
import { Icon } from '../design-system.jsx';

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
        className="inline-link"
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
  const socialIcons = {
    linkedin: 'linkedinBrand',
    twitter: 'xBrand',
    instagram: 'instagramBrand',
    website: 'websiteBrand'
  };
  return (
    <div className="team-card">
      <div className="team-card-image">
        <img
          src={member.image_url || '/placeholder-avatar.svg'}
          alt={member.name}
          loading="lazy"
        />
      </div>
      <div className="team-card-body">
        <h3>{member.name}</h3>
        <p className="team-card-role">{member.role}</p>
        {member.bio && <p className="team-card-bio">{member.bio}</p>}
        {member.social && (
          <div className="team-card-social">
            {Object.entries(member.social).map(([platform, url]) => {
              const iconName = socialIcons[platform] || 'websiteBrand';
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={platform} className="team-social-link">
                  <Icon name={iconName} size={16} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ContributorCard({ contributor }) {
  return (
    <div className="contributor-card">
      <img
        src={contributor.image_url || '/placeholder-avatar.svg'}
        alt={contributor.name}
        loading="lazy"
      />
      <div>
        <strong>{contributor.name}</strong>
        <span>{contributor.role}</span>
      </div>
    </div>
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
      <section className="w-full bg-slate-50 px-5 py-16" aria-busy="true">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="about-loading-block" />
          <div className="about-loading-line" />
          <div className="about-loading-line about-loading-line-short" />
        </div>
      </section>
    );
  }

  return (
    <>
      {page?.hero && (
        <section
          className="relative isolate flex min-h-[360px] w-full items-center overflow-hidden bg-primary-900 bg-cover bg-center"
          style={page.hero.image_url ? {
            backgroundImage: `url(${page.hero.image_url})`,
            backgroundColor: '#15304b'
          } : undefined}
        >
          <div className="absolute inset-0 -z-0 bg-gradient-to-r from-slate-950/95 via-primary-900/85 to-primary-900/55" aria-hidden="true" />
          <div className="absolute inset-0 -z-0 bg-gradient-to-t from-slate-950/35 via-transparent to-primary-900/20" aria-hidden="true" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 sm:py-28">
            <span className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-100 shadow-sm backdrop-blur-sm">About AliverBiopharm</span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl">{page.hero.heading || page.title}</h1>
            {page.hero.subtext && <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-xl">{page.hero.subtext}</p>}
          </div>
        </section>
      )}

      <section className="w-full bg-slate-50 px-5 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          {!page?.hero && (
            <h1 className="mb-10 text-4xl font-extrabold text-primary-900 sm:text-5xl">{page?.title || 'About AliverBiopharm'}</h1>
          )}

          {page?.mission && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.mission.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.mission.heading}</h2>}
              {page.mission.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.vision && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.vision.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.vision.heading}</h2>}
              {page.vision.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.story && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.story.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.story.heading}</h2>}
              {page.story.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.why_choose_us && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.why_choose_us.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.why_choose_us.heading}</h2>}
              {page.why_choose_us.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.learning_philosophy && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.learning_philosophy.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.learning_philosophy.heading}</h2>}
              {page.learning_philosophy.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.founders && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.founders.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.founders.heading}</h2>}
              {page.founders.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.values && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.values.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.values.heading}</h2>}
              {page.values.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.team?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.team_heading || 'Meet our team'}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {page.team.map((member, idx) => (
                  <TeamCard key={idx} member={member} />
                ))}
              </div>
            </div>
          )}

          {page?.contributors?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.contributors_heading || 'Content contributors and reviewers'}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {page.contributors.map((contributor, idx) => (
                  <ContributorCard key={idx} contributor={contributor} />
                ))}
              </div>
            </div>
          )}

          {page?.commitment_to_quality && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.commitment_to_quality.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.commitment_to_quality.heading}</h2>}
              {page.commitment_to_quality.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.future && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.future.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.future.heading}</h2>}
              {page.future.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.legal && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.legal.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.legal.heading}</h2>}
              {page.legal.content.split('\n\n').map((para, i) => (
                <p key={i}><RichText text={para} /></p>
              ))}
            </div>
          )}

          {page?.faq && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {page.faq.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.faq.heading}</h2>}
              <div className="faq-list">
                {(page.faq.questions || []).map((item, idx) => (
                  <details key={idx} className="faq-item">
                    <summary className="faq-question">{item.question}</summary>
                    <p className="faq-answer"><RichText text={item.answer} /></p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {page?.contact && (
            <div className="about-block about-contact">
              {page.contact.heading && <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.contact.heading}</h2>}
              {page.contact.subtext && <p className="about-contact-subtext"><RichText text={page.contact.subtext} /></p>}
              <div className="about-contact-details">
                {page.contact.email && (
                  <a href={`mailto:${page.contact.email}`} className="about-contact-item">
                    <Icon name="emailBrand" size={16} /> {page.contact.email}
                  </a>
                )}
                {page.contact.phone && (
                  <div className="about-contact-item">
                    <FaEnvelope /> {page.contact.phone}
                  </div>
                )}
                {page.contact.address && (
                  <div className="about-contact-item">
                    <Icon name="locationPin" size={16} /> {page.contact.address}
                  </div>
                )}
              </div>
              {page.contact.social_links?.length > 0 && (
                <div className="about-social-links">
                  {page.contact.social_links.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="about-social-link">
                      <i className={s.icon}></i>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {page?.call_to_action && (
            <div className="about-block about-cta">
              <h2 className="mb-5 text-2xl font-bold text-primary-900 sm:text-3xl">{page.call_to_action.heading || 'Start learning with AliverBiopharm'}</h2>
              {page.call_to_action.content && <p className="about-cta-text"><RichText text={page.call_to_action.content} /></p>}
              {page.call_to_action.button_text && (
                <Link
                  to={page.call_to_action.button_url || '/register'}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary-600 px-6 py-3 font-bold text-white transition hover:bg-secondary-700"
                >
                  {page.call_to_action.button_text}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
