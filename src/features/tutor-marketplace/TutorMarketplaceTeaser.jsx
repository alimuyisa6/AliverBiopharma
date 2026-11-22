/* features/tutor-marketplace/TutorMarketplaceTeaser.jsx */
import { useNavigate } from 'react-router-dom';
import { SectionTeaser } from '../home/SectionTeaser';

export default function TutorMarketplaceTeaser() {
  const navigate = useNavigate();

  return (
    <SectionTeaser
      title="Find your tutor"
      intro="Search qualified tutors by subject, level and availability, and connect directly for one-to-one help."
      illustrationType="tutor"
      ctaLabel="Find your tutor"
      onCtaClick={() => navigate('/tutors')}
      imageSide="right"
      backgroundColor="#F8F1E7"
    />
  );
}
