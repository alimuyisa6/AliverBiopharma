 /* src/pages/TutorMarketplace.jsx */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getUnits, listTutorsCached } from '../api/cachedClient';
import { sendContactRequest } from '../api/client';
import TutorCard from '../features/tutor-marketplace/TutorCard';
import Spinner from '../components/Spinner/Spinner';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import { useI18n } from '../contexts/I18nContext';

export default function TutorMarketplace() {
  const { user } = useAuth();
  const { bootstrap, activeGroupId, level } = useLayout();
  const addToast = useToast();
  const { t } = useI18n();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [allTutors, setAllTutors] = useState([]);
  const [curriculumUnits, setCurriculumUnits] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const groupId = activeGroupId || null;
    setLoading(true);
    setLoadError('');

    Promise.all([
      listTutorsCached({ limit: 50 }),
      groupId ? getUnits({ group_id: groupId }) : Promise.resolve([])
    ])
      .then(([tutorData, unitData]) => {
        if (cancelled) return;
        setAllTutors(tutorData || []);
        setTutors(tutorData || []);
        setCurriculumUnits(unitData || []);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error?.message || 'Tutors could not be loaded. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeGroupId]);

  useEffect(() => {
    let filtered = allTutors;

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (tutor) =>
          String(tutor.display_name || '').toLowerCase().includes(query) ||
          String(tutor.headline || '').toLowerCase().includes(query) ||
          String(tutor.specialty || '').toLowerCase().includes(query)
      );
    }

    if (subjectFilter) {
      filtered = filtered.filter((tutor) =>
        tutor.curriculum?.units?.some((unit) => unit.id === subjectFilter)
      );
    }

    if (formatFilter) {
      filtered = filtered.filter((tutor) => {
        const mode = tutor.teaching_mode;
        return mode === formatFilter || mode === 'both';
      });
    }

    setTutors(filtered);
  }, [search, subjectFilter, formatFilter, allTutors]);

  async function handleContact(tutor) {
    if (!user) {
      addToast('Please sign in before contacting a tutor.', 'warning');
      return;
    }

    try {
      const tutorUserId = typeof tutor === 'string' ? tutor : tutor?.user_id;
      if (!tutorUserId) throw new Error('We couldn’t identify this tutor’s account. Refresh the page and try again.');
      await sendContactRequest(tutorUserId, '');
      addToast('Your request has been sent.', 'success');
    } catch (error) {
      addToast(error?.message || 'We couldn’t send your request. Please try again.', 'error');
    }
  }

  function getUiImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find(
      (item) => item.component_key === key
    );
    return component?.properties?.image_url || null;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-sm sm:p-10 lg:p-12" style={{ backgroundColor: '#F8F1E7' }}>
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] lg:gap-12">
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-secondary-200 bg-secondary-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-800">{t('common.tutorMarketplace')}</span>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">Find a tutor who fits your needs</h1>

            <p className="mt-0 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              For learners, schools, and institutions. Filter tutors by subject, level, and teaching format.
            </p>

            {getUiImage('tutor_marketplace_hero') && (
              <div className="w-full overflow-hidden rounded-3xl border-[6px] border-white bg-white p-1 shadow-xl shadow-primary-900/10">
                <img
                  src={getUiImage('tutor_marketplace_hero')}
                  alt="Tutor supporting a learner"
                  className="aspect-[5/4] max-h-[360px] w-full rounded-2xl object-cover object-center"
                  loading="lazy"
                />
              </div>
            )}

          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-white/70 p-4 shadow-lg shadow-slate-900/5 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.4fr)_minmax(12rem,0.4fr)]" style={{ backgroundColor: '#E8F4F2' }}>
          <Input
            type="text"
            placeholder={level === 'Pharmacy' ? 'Search by name, specialty, or course unit' : 'Search by name, specialty, or subject'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="magnifying-glass"
            className="w-full"
          />

          <select
            aria-label={level === 'Pharmacy' ? 'Filter by course unit' : 'Filter by subject'}
            className="block min-h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm text-foreground shadow-sm outline-none transition hover:border-primary-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">{level === 'Pharmacy' ? 'All course units' : 'All subjects'}</option>
            {curriculumUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>


          <select
            aria-label="Filter by teaching format"
            className="block min-h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm text-foreground shadow-sm outline-none transition hover:border-primary-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
          >
            <option value="">All formats</option>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#EAF2FA' }}>
          <div><h2 className="m-0 text-xl font-bold text-primary-900">Available tutors</h2><p className="mt-1 text-sm text-slate-500">{tutors.length} {tutors.length === 1 ? "tutor" : "tutors"} match your search</p></div>
          {(search || subjectFilter || formatFilter) && <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50" onClick={() => { setSearch(""); setSubjectFilter(""); setFormatFilter(""); }}>Clear filters <span aria-hidden="true">×</span></button>}
        </div>

        {loadError ? (
          <EmptyState
            title="Tutors are temporarily unavailable"
            description={loadError}
            action={<Button onClick={() => window.location.reload()}>Try again</Button>}
          />
        ) : tutors.length === 0 ? (
          <EmptyState
            image={getUiImage('empty_state_tutors')}
            title="No tutors found"
            description="Try changing your filters or search terms."
            action={
              <Button
                onClick={() => {
                  setSearch('');
                  setSubjectFilter('');
                  setFormatFilter('');
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onContact={handleContact}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
