 /* src/pages/TutorMarketplace.jsx */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getUnits, listTutorsCached } from '../api/cachedClient';
import { sendContactRequest } from '../api/client';
import TutorCard from '../features/tutor-marketplace/TutorCard';
import Spinner from '../components/Spinner/Spinner';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import Icon from '../components/Icon/Icon';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import { useI18n } from '../contexts/I18nContext';

export default function TutorMarketplace() {
  const { user } = useAuth();
  const { bootstrap, activeGroupId, level } = useLayout();
  const addToast = useToast();
  const navigate = useNavigate();
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
      <div className="section">
        <div className="mb-8 rounded-3xl border border-primary-100 bg-primary-50 p-6 sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-800">{t('common.tutorMarketplace')}</span>

            <h2>Find a tutor who fits your needs</h2>

            <h3 className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              For learners, schools, and institutions. Filter tutors by subject, level, and teaching format.
            </h3>

            {getUiImage('tutor_marketplace_hero') && (
              <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-md">
                <img
                  src={getUiImage('tutor_marketplace_hero')}
                  alt="Tutor marketplace"
                />
              </div>
            )}

          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.4fr)_minmax(12rem,0.4fr)]">
          <Input
            type="text"
            placeholder={level === 'Pharmacy' ? 'Search by name, specialty, or course unit' : 'Search by name, specialty, or subject'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="magnifying-glass"
            className="w-full"
          />

          <select
            className="min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
            className="filter-select"
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
