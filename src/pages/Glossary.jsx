 import { useState, useEffect, useCallback } from 'react';
import GlossaryView from './GlossaryView';
import { useAuth } from '../contexts/AuthContext';
import {
  getGlossaryTerms,
  getGlossaryTerm,
  getGlossaryCategories
} from '../api/client';
import { useLevelFilter } from '../hooks/useLevelFilter';

const glossaryTermsCache = new Map();
const glossaryCategoriesCache = new Map();
const glossaryTermCache = new Map();

export default function Glossary() {
  const { user } = useAuth();
  const { level, class_name } = useLevelFilter();
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTerm, setActiveTerm] = useState(null);
  const [termContent, setTermContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [termLoading, setTermLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const key = `${level || ''}:${class_name || ''}`;
    const cached = glossaryCategoriesCache.get(key);
    if (cached) setCategories(cached);

    getGlossaryCategories(level, class_name)
      .then((data) => {
        const next = Array.isArray(data) ? data : [];
        glossaryCategoriesCache.set(key, next);
        setCategories(next);
      })
      .catch(() => {
        if (!cached) setCategories([]);
      });
  }, [level, class_name]);

  const fetchTerms = useCallback(() => {
    const key = `${level || ''}:${class_name || ''}:${selectedCategory || ''}:${searchQuery || ''}`;
    const cached = glossaryTermsCache.get(key);

    if (cached) {
      setTerms(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    getGlossaryTerms(level, selectedCategory || undefined, searchQuery || undefined, class_name)
      .then((data) => {
        const next = Array.isArray(data) ? data : [];
        glossaryTermsCache.set(key, next);
        setTerms(next);
      })
      .catch(() => {
        if (!cached) setTerms([]);
      })
      .finally(() => setLoading(false));
  }, [level, selectedCategory, searchQuery, class_name]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleTermClick = useCallback(async (term) => {
    const key = `${level || ''}:${class_name || ''}:${term.slug}`;
    const cached = glossaryTermCache.get(key);
    setActiveTerm(term);
    setTermContent(cached || null);
    setTermLoading(!cached);
    try {
      const data = await getGlossaryTerm(term.slug, level, class_name);
      glossaryTermCache.set(key, data);
      setTermContent(data);
    } catch {
      if (!cached) setTermContent(null);
    } finally {
      setTermLoading(false);
    }
  }, [level, class_name]);

  const getLevelColor = (lvl) => {
    if (lvl === 'O-Level') return 'var(--primary)';
    if (lvl === 'A-Level') return 'var(--warm)';
    if (lvl === 'Pharmacy') return 'var(--success)';
    return 'var(--primary)';
  };

  const groupedTerms = {};
  (terms || []).forEach(term => {
    const cat = term.category || 'General';
    if (!groupedTerms[cat]) groupedTerms[cat] = [];
    groupedTerms[cat].push(term);
  });

  return (
    <GlossaryView
      user={user}
      selectedLevel={level}
      selectedClass={class_name}
      terms={terms}
      categories={categories}
      selectedCategory={selectedCategory}
      searchQuery={searchQuery}
      activeTerm={activeTerm}
      termContent={termContent}
      loading={loading}
      termLoading={termLoading}
      sidebarOpen={sidebarOpen}
      groupedTerms={groupedTerms}
      getLevelColor={getLevelColor}
      onCategoryChange={setSelectedCategory}
      onSearchChange={setSearchQuery}
      onTermClick={handleTermClick}
      onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      onClearSearch={() => { setSearchQuery(''); setSelectedCategory(''); }}
    />
  );
}
