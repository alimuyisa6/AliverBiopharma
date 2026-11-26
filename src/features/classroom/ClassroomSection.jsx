 // pages/ClassroomSection.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { getLiveClassroomFeed } from '../../api/cachedClient';
import SplitCard from '../../components/SplitCard/SplitCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import Spinner from '../../components/Spinner/Spinner';


const STATUS_LABEL = {
  live: 'Live Now',
  open_floor: 'Open Floor',
  upcoming: 'Upcoming'
};

const STATUS_VARIANT = {
  live: 'danger',
  open_floor: 'primary',
  upcoming: 'warm'
};

export function ClassroomSection({ user }) {
  const navigate = useNavigate();
  const { bootstrap } = useLayout();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const data = await getLiveClassroomFeed();
        if (!cancelled) {
          setFeed(Array.isArray(data) ? data : []);
          setFeedError(false);
        }
      } catch {
        if (!cancelled) setFeedError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeed();
    const interval = window.setInterval(loadFeed, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [retryKey]);

  function getUiImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === key);
    return component?.properties?.image_url || null;
  }

  if (loading) {
    return (
      <section id="classroom" className="w-full py-12 sm:py-16">
        <div className="flex min-h-40 items-center justify-center"><Spinner size="lg" /></div>
      </section>
    );
  }

  const backgroundUrl = getUiImage('classroom_section_background') || '/images/marketplace.jpg';

  return (
    <section
      id="classroom"
      className={`relative isolate w-full overflow-hidden px-5 py-12 sm:px-8 sm:py-16 ${feed.length > 0 ? 'bg-cover bg-center bg-fixed text-white' : 'bg-background text-foreground'}`}
      style={feed.length > 0 ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
    >
      {feed.length > 0 && <div className="absolute inset-0 -z-0 bg-primary-900/80" aria-hidden="true" />}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <header className="mb-8 max-w-3xl">
          <h2 className={`text-3xl font-extrabold leading-tight sm:text-4xl ${feed.length > 0 ? 'text-white' : 'text-primary-900'}`}>Where Questions<br />Meet Real Answers</h2>
          <p className={`mt-4 text-base leading-7 ${feed.length > 0 ? 'text-primary-100' : 'text-muted'}`}>Step into live sessions with verified tutors — ask, discuss, and learn in real time.</p>
        </header>

        {feedError && feed.length > 0 && (
          <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>Live classroom updates are temporarily unavailable. Showing the latest rooms we loaded.</span>
            <Button size="sm" variant="secondary" onClick={() => setRetryKey((value) => value + 1)}>Retry updates</Button>
          </div>
        )}

        {feedError && feed.length === 0 ? (
          <EmptyState icon="warning" title="Classroom updates are unavailable" description="We could not load live sessions just now. Please try again." action={<Button variant="secondary" onClick={() => { setLoading(true); setRetryKey((value) => value + 1); }}>Try again</Button>} />
        ) : feed.length === 0 ? (
          <EmptyState image={getUiImage('empty_state_classroom') || '/Svg%20illustrations/Chat-rafiki.svg'} title="The room is quiet, for now" description="No live discussions are running at the moment. Start one yourself or check back shortly." action={<Button variant="secondary" onClick={() => navigate('/tutor/apply')}><Icon name="user-pen" /> Become a Tutor</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feed.slice(0, 6).map((room) => (
              <SplitCard key={room.id} image={room.image_url} fallbackImage={getUiImage('default_classroom_thumbnail') || '/images/classroom-default.jpg'} title={`${room.unit_label || 'Topic'}: ${room.unit_name || room.topic_name || room.title}`} subtitle={room.group_name ? `${room.group_label || 'Class'}: ${room.group_name}` : STATUS_LABEL[room.status] || room.status} badge={STATUS_LABEL[room.status] || room.status} badgeVariant={STATUS_VARIANT[room.status] || 'primary'} link={`/classroom/${room.id}`} buttonText={user ? 'Enter' : 'Join'} />
            ))}
          </div>
        )}

        {feed.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate('/classroom')}><Icon name="users" /> {user ? 'View All Rooms' : 'Login to Join'}</Button>
            <Button variant="secondary" onClick={() => navigate('/tutor/apply')}><Icon name="user-pen" /> Become a Tutor</Button>
          </div>
        )}
      </div>
    </section>
  );
}
