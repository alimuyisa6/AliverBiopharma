import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';

export default function TutorCard({ tutor, onContact, user }) {
  const initials = (tutor.display_name || 'Tutor')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const teachingMode = tutor.teaching_mode === 'both'
    ? 'Online & in-person'
    : tutor.teaching_mode === 'in-person'
      ? 'In-person'
      : 'Online';

  return (
    <article className="ab-card group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/10">
      <div className="h-1.5 w-full bg-primary-700" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-lg font-extrabold text-primary-800 shadow-inner">
            {tutor.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutor.display_name || 'Tutor'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-label={tutor.display_name || 'Tutor'}>{initials || <Icon name="user-graduate" monochrome />}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-lg font-bold leading-snug text-primary-900 transition-colors group-hover:text-primary-700">
              {tutor.display_name || 'Tutor'}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
              {tutor.headline || tutor.specialty || 'Supporting learners to reach their goals.'}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">
              <Icon name="graduation-cap" monochrome className="h-3.5 w-3.5" />
              {teachingMode}
            </span>
          </div>
        </div>

        {tutor.specialty && (
          <div className="mt-5 rounded-xl border border-secondary-100 bg-secondary-50 px-3.5 py-3">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-secondary-800">Specialty</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{tutor.specialty}</p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-5">
          <Link
            to={`/tutor/${tutor.id}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-bold text-primary-800 no-underline transition hover:border-primary-500 hover:bg-primary-700 hover:text-white"
          >
            View profile <Icon name="arrow-right" monochrome className="h-4 w-4" />
          </Link>
          {user && onContact && (
            <Button size="sm" onClick={() => onContact(tutor.user_id)} className="min-h-11 rounded-xl px-4">
              <Icon name="message" monochrome /> Contact
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
