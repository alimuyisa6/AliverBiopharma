/* features/tutor-marketplace/TutorMarketplaceTeaser.jsx */
import { useNavigate } from 'react-router-dom';
import { SectionTeaser } from '../home/SectionTeaser';

export default function TutorMarketplaceTeaser() {
  const navigate = useNavigate();
  const imageUrl = '/images/tutor-marketplace-illustration.svg';

  return (
    <SectionTeaser
      eyebrow="Tutor Marketplace"
      title="Find your tutor"
      intro="Search qualified tutors by subject, level and availability, and connect directly for one-to-one help."
      imageUrl={imageUrl}
      imageAlt="A tutor helping a student"
      ctaLabel="Find your tutor"
      onCtaClick={() => navigate('/tutors')}
      imageSide="right"
    />
  );
}
