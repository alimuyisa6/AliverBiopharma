import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTutorDetail } from '../api/client';
import Icon from '../components/Icon/Icon';
import { UI } from '../design-system';

export default function TutorProfile() {
  const { profileId } = useParams();
  const [tutor, setTutor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getTutorDetail(profileId).then((data) => active && setTutor(data)).catch((err) => active && setError(err?.message || 'We couldn’t load this tutor profile. Please try again.'));
    return () => { active = false; };
  }, [profileId]);

  return (
    <main className="min-h-screen w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link to="/tutors" className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-bold text-primary-800 no-underline hover:text-primary-950"><Icon name="arrow-left" /> Back to tutor listings</Link>
        {error ? <section className={`${UI.card} grid gap-3 p-6 sm:p-8`} role="alert"><h1 className="text-2xl font-extrabold text-primary-900">This tutor profile is unavailable</h1><p className="text-sm leading-7 text-muted">{error}</p></section> : !tutor ? <section className={`${UI.card} flex min-h-40 items-center justify-center p-6`} aria-busy="true"><p className="text-sm font-semibold text-muted">Loading tutor profile…</p></section> : (
          <article className={`${UI.card} grid gap-7 p-5 sm:p-8`}>
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-primary-700">{tutor.avatar_url ? <img src={tutor.avatar_url} alt={tutor.display_name || 'Tutor'} className="h-full w-full object-cover" /> : <Icon name="user-graduate" size="2.5rem" />}</div>
              <div className="min-w-0"><h1 className="text-2xl font-extrabold text-primary-900 sm:text-3xl">{tutor.display_name}</h1>{tutor.headline && <p className="mt-2 text-sm leading-6 text-muted">{tutor.headline}</p>}</div>
            </header>
            {tutor.bio && <section className="grid gap-2"><h2 className="text-lg font-bold text-primary-900">About</h2><p className="text-sm leading-7 text-slate-700">{tutor.bio}</p></section>}
            <section className="grid gap-3 sm:grid-cols-2" aria-label="Tutor details">
              {tutor.years_experience != null && <div className="rounded-xl bg-primary-50 p-4"><span className="block text-xs font-bold uppercase tracking-wide text-muted">Experience</span><strong className="mt-1 block text-sm text-primary-900">{tutor.years_experience} years</strong></div>}
              {(tutor.district || tutor.country) && <div className="rounded-xl bg-primary-50 p-4"><span className="block text-xs font-bold uppercase tracking-wide text-muted">Location</span><strong className="mt-1 block text-sm text-primary-900">{[tutor.district, tutor.country].filter(Boolean).join(', ')}</strong></div>}
              {tutor.teaching_mode && <div className="rounded-xl bg-primary-50 p-4"><span className="block text-xs font-bold uppercase tracking-wide text-muted">Teaching format</span><strong className="mt-1 block text-sm text-primary-900">{tutor.teaching_mode}</strong></div>}
              {tutor.hourly_rate && <div className="rounded-xl bg-primary-50 p-4"><span className="block text-xs font-bold uppercase tracking-wide text-muted">Hourly rate</span><strong className="mt-1 block text-sm text-primary-900">{tutor.hourly_rate}</strong></div>}
            </section>
          </article>
        )}
      </div>
    </main>
  );
}
