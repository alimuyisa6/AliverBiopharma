 /* features/classroom/ClassroomTeaser.jsx */
import { useNavigate } from 'react-router-dom';
import { SectionTeaser } from '../home/SectionTeaser';

export default function ClassroomTeaser() {
  const navigate = useNavigate();
  return (
    <SectionTeaser
      title="Find a live room"
      intro="Step into live sessions with verified tutors — ask, discuss, and learn in real time."
      illustrationType="collaboration"
      ctaLabel="Find a live room"
      onCtaClick={() => navigate('/classroom')}
      imageSide="left"
      backgroundColor="#EAF2FA"
    />
  );
}
