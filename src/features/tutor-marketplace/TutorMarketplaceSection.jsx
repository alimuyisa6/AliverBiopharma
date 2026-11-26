 import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { listTutorsCached } from '../../api/cachedClient';
import { sendContactRequest } from '../../api/client';
import SplitCard from '../../components/SplitCard/SplitCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import Spinner from '../../components/Spinner/Spinner';
import StorysetIllustration from '../../components/StorysetIllustration';
import { useToast } from '../../components/Toast/Toast';
import { UI } from '../../design-system';

export default function TutorMarketplaceSection() {
  const { user } = useAuth();
  const { bootstrap } = useLayout();
  const addToast = useToast();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    listTutorsCached({ limit: 6 })
      .then((data) => { if (!cancelled) setTutors(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  function getUiImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === key);

    return component?.properties?.image_url || null;
  }

  const handleContact = async (tutor) => {
    if (!user) {
      addToast('Please sign in to contact a tutor', 'warning');
      return;
    }

    try {
      await sendContactRequest(tutor.user_id, '');
      addToast('Request sent!', 'success');
    } catch {
      addToast('Could not send request', 'error');
    }
  };

  if (loading) return <section className="w-full py-12 sm:py-16"><div className="flex min-h-40 items-center justify-center"><Spinner size="lg" /></div></section>;

  const backgroundUrl = getUiImage('tutor_section_background') || '/images/tutors.jpg';

  return (
    <section className={`relative isolate w-full overflow-hidden px-5 py-12 sm:px-8 sm:py-16 ${tutors.length > 0 ? 'bg-cover bg-center bg-fixed text-white' : 'bg-background text-foreground'}`} style={tutors.length > 0 ? { backgroundImage: `url(${backgroundUrl})` } : undefined}>
      {tutors.length > 0 && <div className="absolute inset-0 -z-0 bg-primary-900/80" aria-hidden="true" />}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 max-w-3xl"><h2 className={`text-3xl font-extrabold leading-tight sm:text-4xl ${tutors.length > 0 ? 'text-white' : 'text-primary-900'}`}>Learn From Someone<br />Who Gets It</h2><p className={`mt-4 text-base leading-7 ${tutors.length > 0 ? 'text-primary-100' : 'text-muted'}`}>Browse verified specialists in biology and pharmacy, matched to how you learn best.</p></div>
          <StorysetIllustration name="teaching" alt="Tutor guiding a learner" className="hidden w-36 shrink-0 object-contain sm:block" />
        </header>

        {tutors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tutor) => <SplitCard key={tutor.id} image={tutor.avatar_url} fallbackImage={getUiImage('default_tutor_avatar') || '/images/default-tutor.jpg'} title={tutor.display_name} subtitle={tutor.headline || 'Qualified Tutor'} badge={tutor.specialty || 'Tutor'} badgeVariant="success" link={`/tutor/${tutor.id}`} buttonText="View" onButtonClick={() => handleContact(tutor)} contactLoading={contactingId === tutor.user_id} />)}
            </div>
            <div className="flex flex-wrap gap-3"><Link to="/tutors" className={UI.primaryButton}>Browse All Tutors <Icon name="arrow-right" /></Link></div>
          </>
        ) : (
          <EmptyState image={getUiImage('empty_state_tutors')} title="Be the first to teach here" description="Our marketplace is just getting started — apply as a tutor and claim your spot before anyone else." action={<div className="flex flex-wrap justify-center gap-3"><Link to="/tutors" className={UI.secondaryButton}>Browse anyway</Link><Link to="/tutor/apply" className={UI.primaryButton}>Apply as a Tutor</Link></div>} />
        )}
      </div>
    </section>
  );
}
