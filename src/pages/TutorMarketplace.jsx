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

export default function TutorMarketplace() {
  const { user } = useAuth();
  const { bootstrap, activeGroupId } = useLayout();
  const addToast = useToast();
  const navigate = useNavigate();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
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

    if (levelFilter) {
      filtered = filtered.filter((tutor) =>
        tutor.curriculum?.levels?.some((level) => level.id === levelFilter)
      );
    }

    if (formatFilter) {
      filtered = filtered.filter((tutor) => {
        const mode = tutor.teaching_mode;
        return mode === formatFilter || mode === 'both';
      });
    }

    setTutors(filtered);
  }, [search, subjectFilter, levelFilter, formatFilter, allTutors]);

  async function handleContact(tutor) {
    if (!user) {
      addToast('Please sign in to contact a tutor', 'warning');
      return;
    }

    try {
      const tutorUserId = typeof tutor === 'string' ? tutor : tutor?.user_id;
      if (!tutorUserId) throw new Error('Tutor account could not be identified. Please refresh and try again.');
      await sendContactRequest(tutorUserId, '');
      addToast('Request sent!', 'success');
    } catch (error) {
      addToast(error?.message || 'Could not send request', 'error');
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
      <div className="section">
        <div className="fcd-loading-wrap">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-marketplace-page">
      <div className="section">
        <div className="tutor-marketplace-intro">
          <div className="tutor-marketplace-intro-content">
            <span className="eyebrow">Tutor Marketplace</span>

            <h2>Find a qualified tutor</h2>

            <h3 className="section-description">
              For individual learners, schools and institutions — filter by
              subject, level and availability.
            </h3>

            {getUiImage('tutor_marketplace_hero') && (
              <div className="tutor-marketplace-intro-image">
                <img
                  src={getUiImage('tutor_marketplace_hero')}
                  alt="Tutor marketplace"
                />
              </div>
            )}

            <div className="tutor-marketplace-intro-action">
              <Button
                variant="primary"
                className="tutor-marketplace-find-tutor-btn"
                onClick={() => document.querySelector('.tutor-search-input')?.focus()}
              >
                Find a Tutor
              </Button>
            </div>
          </div>
        </div>

        <div className="tutor-search">
          <Input
            type="text"
            placeholder="Search by name, specialty, or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="magnifying-glass"
            className="tutor-search-input"
          />

          <select
            className="filter-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {curriculumUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {[...new Map(
              allTutors
                .flatMap((tutor) => tutor.curriculum?.levels || [])
                .map((level) => [level.id, level])
            ).values()].map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
          >
            <option value="">All Formats</option>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
          </select>
        </div>

        {tutors.length === 0 ? (
          <EmptyState
            image={getUiImage('empty_state_tutors')}
            title="No tutors found"
            description="Try adjusting your filters or search terms."
            action={
              <Button
                onClick={() => {
                  setSearch('');
                  setSubjectFilter('');
                  setLevelFilter('');
                  setFormatFilter('');
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="tutor-grid-flat">
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
