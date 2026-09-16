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
    <div className="section faq-page">
      <FaqAccordion data={sections?.faq} standalone />
    </div>
  );
}
