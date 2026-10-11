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
    if (!levelId) return undefined;

    let mounted = true;
    const cached = resourcesSectionsCache.get(levelId);
    if (cached) setSections(cached);

    getSections(levelId)
      .then((data) => {
        const next = data || {};
        resourcesSectionsCache.set(levelId, next);
        if (mounted) setSections(next);
      })
      .catch(() => {});

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
