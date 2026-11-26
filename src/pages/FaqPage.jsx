/* pages/FaqPage.jsx */
import { useState, useEffect } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import { FaqAccordion } from '../features/home/FaqAccordion';

export default function FaqPage() {
  const { level } = useLayout();
  const [sections, setSections] = useState({});

  useEffect(() => {
    if (level?.id) {
      getSections(level.id).then(setSections).catch(() => {});
    }
  }, [level]);

  return (
    <main className="faq-page-shell w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <FaqAccordion data={sections?.faq} standalone />
    </main>
  );
}
