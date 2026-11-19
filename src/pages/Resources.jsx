 // src/pages/Resources.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import ResourcesView from '../features/resources/ResourcesView';

const resourcesSectionsCache = new Map();

export default function Resources() {
  const { user } = useAuth();
  const { level } = useLayout();
  const navigate = useNavigate();

  const [sections, setSections] = useState({});

  useEffect(() => {
    const levelId = level?.id;
    let mounted = true;

    if (!levelId) {
      setSections({});
      return () => { mounted = false; };
    }

    const cached = resourcesSectionsCache.get(levelId);
    setSections(cached || {});

    getSections(levelId)
      .then((data) => {
        const next = data && typeof data === 'object' ? data : {};
        resourcesSectionsCache.set(levelId, next);
        if (mounted) setSections(next);
      })
      .catch(() => {
        if (mounted && !cached) setSections({});
      });

    return () => { mounted = false; };
  }, [level?.id]);

  return (
    <>
      <ResourcesView
        sections={sections}
        user={user}
        navigate={navigate}
      />
    </>
  );
}
