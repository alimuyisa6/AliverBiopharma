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

  useEffect(() => {
    let cancelled = false;

    const groupId = activeGroupId || null;

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
      .catch(() => {})
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
          tutor.display_name.toLowerCase().includes(query) ||
          (tutor.headline && tutor.headline.toLowerCase().includes(query)) ||
          (tutor.specialty && tutor.specialty.toLowerCase().includes(query))
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
        <div className="fcd-loading-wrap">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6 shadow-sm sm:p-10 lg:p-12">
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-secondary-200 bg-secondary-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-800">{t('common.tutorMarketplace')}</span>

            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-primary-900 sm:text-4xl lg:text-5xl">Find a tutor who fits your needs</h1>

            <h3 className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              For learners, schools, and institutions. Filter tutors by subject, level, and teaching format.
            </h3>

            {getUiImage('tutor_marketplace_hero') && (
              <div className="overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-xl shadow-primary-900/10">
                <img
                  src={getUiImage('tutor_marketplace_hero')}
                  alt="Tutor marketplace"
                />
              </div>
            )}

          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-lg shadow-slate-900/5 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.4fr)_minmax(12rem,0.4fr)]">
          <Input
            type="text"
            placeholder={level === 'Pharmacy' ? 'Search by name, specialty, or course unit' : 'Search by name, specialty, or subject'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="magnifying-glass"
            className="w-full"
          />

          <select
            className="min-h-12 w-full rounded-xl border border-border bg-slate-50 px-4 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
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
            className="min-h-12 w-full rounded-xl border border-border bg-slate-50 px-4 text-sm text-foreground outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
          >
            <option value="">All formats</option>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
          </select>
        </div>

        {tutors.length === 0 ? (
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
