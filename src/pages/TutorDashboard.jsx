 /* pages/TutorDashboard.jsx */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLevelFilter } from '../hooks/useLevelFilter';
import {
  getClassroomLevels,
  getClassroomTopics,
  getTutorStatus,
  getTutorRooms,
  createClassroom,
  endClassroom
} from '../api/client';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Select from '../components/Select/Select';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

export default function TutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { displayName } = useLevelFilter();
  const addToast = useToast();

  const [tutorStatus, setTutorStatus] = useState(null);
  const [levels, setLevels] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [endingRoomId, setEndingRoomId] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    level: '',
    group_id: '',
    class_name: '',
    topic_id: '',
    topic_name: '',
    room_type: 'free',
    scheduled_at: ''
  });
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const selectedLevel = levels.find((lvl) => lvl.key === form.level);
  const isPharmacyLevel = /pharmacy/i.test(`${selectedLevel?.kind || ''} ${selectedLevel?.display_name || ''}`);
  const groupLabel = isPharmacyLevel ? 'Program' : (selectedLevel?.group_label || 'Class');
  const unitLabel = isPharmacyLevel ? 'Course Unit' : (selectedLevel?.unit_label || 'Topic');

  useEffect(() => {
    if (!user) {
      setError('Please sign in to access your tutor dashboard.');
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [user]);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [statusData, levelsData] = await Promise.all([
        getTutorStatus(),
        getClassroomLevels()
      ]);

      setTutorStatus(statusData?.application || null);
      setLevels(levelsData || []);

      if (statusData?.application?.status === 'approved') {
        await fetchActiveRooms();
      }
    } catch {
      setError('We couldn’t load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveRooms() {
    try {
      const data = await getTutorRooms();

      setActiveRooms(data?.rooms || data || []);
    } catch {
      addToast('We couldn’t load your classrooms. Please try again.', 'error');
    }
  }

  async function fetchTopics(groupId) {
    setLoadingTopics(true);

    try {
      const data = await getClassroomTopics(groupId);

      setTopics(data || []);
    } catch {
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  }

  async function handleCreateRoom() {
    if (!form.title || !form.level || !form.class_name || !form.topic_id || !form.topic_name) {
      setCreateError('Complete all required fields before creating a classroom.');
      return;
    }

    setSubmitting(true);
    setCreateError(null);

    try {
      await createClassroom({
        title: form.title,
        unit_id: form.topic_id,
        room_type: form.room_type,
        scheduled_at: form.scheduled_at || null
      });

      addToast('Your classroom has been created.', 'success');
      setShowCreateForm(false);
      setForm({
        title: '',
        level: '',
        group_id: '',
        class_name: '',
        topic_id: '',
        topic_name: '',
        room_type: 'free',
        scheduled_at: ''
      });
      fetchActiveRooms();
    } catch (err) {
      setCreateError(err.message || 'We couldn’t create the classroom. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEndRoom(roomId) {
    setEndingRoomId(roomId);
    try {
      await endClassroom(roomId);
      addToast('The classroom has ended.', 'success');
      await fetchActiveRooms();
    } catch (err) {
      addToast(err.message || 'We couldn’t end the classroom. Please try again.', 'error');
    } finally {
      setEndingRoomId(null);
    }
  }




  if (loading) return <main className="flex min-h-[60vh] items-center justify-center bg-primary-50" aria-busy="true"><Spinner size="lg" /></main>;

  if (error) return <main className="min-h-[60vh] bg-primary-50 px-4 py-12"><div className="mx-auto max-w-3xl"><EmptyState icon="exclamation-triangle" title="Error" description={error} action={<Button onClick={() => navigate('/login')}>Log In</Button>} /></div></main>;

  const application = tutorStatus;
  const isApproved = application?.status === 'approved';
  const statusLabels = {
    pending: { label: 'Under review', tone: 'warning', icon: 'clock' },
    scheduled: { label: 'Interview scheduled', tone: 'primary', icon: 'calendar' },
    interviewed: { label: 'Interview completed', tone: 'secondary', icon: 'circle' },
    approved: { label: 'Approved tutor', tone: 'success', icon: 'circle-check' },
    rejected: { label: 'Application rejected', tone: 'error', icon: 'circle-xmark' }
  };
  const statusTone = { warning: 'bg-amber-100 text-amber-900', primary: 'bg-primary-100 text-primary-900', secondary: 'bg-secondary-100 text-secondary-900', success: 'bg-emerald-100 text-emerald-900', error: 'bg-red-100 text-red-900' };
  const levelName = displayName || '';

  return (
    <main className="min-h-screen w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <PageHeader label="Tutor workspace" title={`Tutor dashboard${levelName ? ` · ${levelName}` : ''}`} subtitle="Manage your teaching sessions, create new classrooms, and track your tutoring activity." />

        {!application && <EmptyState icon="graduation-cap" title="No Application Found" description="You haven't applied to become a tutor yet." action={<Button onClick={() => navigate('/tutor/apply')} icon="paper-plane">Start Application</Button>} />}

        {application && !isApproved && statusLabels[application.status] && (
          <section className={`${UI.card} mx-auto grid w-full max-w-2xl gap-5 p-6 sm:p-8`}>
            <div className="flex flex-wrap items-center gap-4"><span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${statusTone[statusLabels[application.status].tone]}`}><Icon name={statusLabels[application.status].icon} size="1.5rem" /></span><div><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusTone[statusLabels[application.status].tone]}`}>{statusLabels[application.status].label}</span><p className="mt-2 text-xs text-muted">Applied {new Date(application.created_at).toLocaleDateString()}</p></div></div>
            <div className="grid gap-3 border-t border-border pt-5 text-sm text-slate-700"><p><strong>Level:</strong> {application.level}</p><p><strong>Class:</strong> {application.class_name}</p><p><strong>Subjects:</strong> {(application.subjects || []).join(', ')}</p></div>
          </section>
        )}

        {isApproved && (
          <div className="grid gap-7">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"><div className="flex items-center gap-3 text-sm font-bold text-emerald-900"><Icon name="circle-check" />Approved tutor — {application.display_name || 'Tutor'}</div><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => navigate('/quiz/review')} icon="clipboard-check">Essay marking</Button><Button variant={showCreateForm ? 'secondary' : 'primary'} size="sm" onClick={() => { setShowCreateForm((value) => !value); setCreateError(null); }} icon={showCreateForm ? 'xmark' : 'plus'}>{showCreateForm ? 'Cancel' : 'Create Classroom'}</Button></div></div>

            {showCreateForm && (
              <section className={`${UI.card} grid gap-5 p-5 sm:p-7`}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold text-primary-900"><Icon name="plus" className="text-primary-700" />New Classroom</h2>
                <Input label="Room Title" placeholder="e.g., Introduction to Cell Biology" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select label="Level" value={form.level} onChange={(event) => { setForm((prev) => ({ ...prev, level: event.target.value, group_id: '', class_name: '', topic_id: '', topic_name: '' })); setTopics([]); }} options={levels.map((lvl) => ({ value: lvl.key, label: lvl.display_name || lvl.key }))} placeholder="Choose level..." />
                  <Select label={groupLabel} value={form.group_id} onChange={(event) => { const groupId = event.target.value; const found = (levels.find((lvl) => lvl.key === form.level)?.classes || []).find((cls) => (typeof cls === 'string' ? cls : cls.id) === groupId); const name = found ? (typeof found === 'string' ? found : found.name) : ''; setForm((prev) => ({ ...prev, group_id: groupId, class_name: name, topic_id: '', topic_name: '' })); if (groupId) fetchTopics(groupId); }} options={(levels.find((lvl) => lvl.key === form.level)?.classes || []).map((cls) => ({ value: typeof cls === 'string' ? cls : cls.id, label: typeof cls === 'string' ? cls : cls.name }))} placeholder={`Choose ${groupLabel.toLowerCase()}...`} disabled={!form.level} />
                </div>
                <Select label={unitLabel} value={form.topic_id} onChange={(event) => { const selected = topics.find((topic) => topic.id === event.target.value); setForm((prev) => ({ ...prev, topic_id: event.target.value, topic_name: selected?.unit_name || selected?.topic_name || '' })); }} options={topics.map((topic) => ({ value: topic.id, label: topic.unit_name || topic.topic_name }))} placeholder={loadingTopics ? `Loading ${unitLabel.toLowerCase()}s...` : `Choose ${unitLabel.toLowerCase()}...`} disabled={!form.group_id || loadingTopics} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Select label="Room Type" value={form.room_type} onChange={(event) => setForm((prev) => ({ ...prev, room_type: event.target.value }))} options={[{ value: 'free', label: 'Free Discussion' }, { value: 'hard_topic', label: 'Hard Topic (Scheduled)' }, { value: 'premium', label: 'Premium (Scheduled)' }]} />{(form.room_type === 'hard_topic' || form.room_type === 'premium') && <Input label="Schedule" type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm((prev) => ({ ...prev, scheduled_at: event.target.value }))} />}</div>
                {createError && <p className={UI.status.error} role="alert"><Icon name="exclamation-triangle" />{createError}</p>}
                <div className="flex justify-end border-t border-border pt-4"><Button onClick={handleCreateRoom} loading={submitting} icon="plus">Create Classroom</Button></div>
              </section>
            )}

            <section className="grid gap-5"><header className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-3 text-xl font-extrabold text-primary-900"><Icon name="users" />Your Active Classrooms</h2><span className="rounded-full bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-900">{activeRooms.length} rooms</span></header>
              {activeRooms.length === 0 ? <EmptyState icon="door-closed" title="No Active Classrooms" description="You haven't created any classrooms yet." /> : <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">{activeRooms.map((room) => { const roomTone = room.status === 'live' ? 'bg-emerald-700' : room.status === 'open_floor' ? 'bg-primary-800' : 'bg-secondary-700'; const roomIcon = room.status === 'live' ? 'circle' : room.status === 'open_floor' ? 'users' : 'clock'; const roomLabel = room.status === 'live' ? 'Live' : room.status === 'open_floor' ? 'Open Floor' : 'Upcoming'; return <article key={room.id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className={`flex items-center gap-2 px-4 py-3 text-white ${roomTone}`}><Icon name={roomIcon} /><span className="text-xs font-bold">{roomLabel}</span></div><div className="grid flex-1 gap-2 p-5"><h3 className="text-lg font-extrabold text-primary-900">{room.title}</h3><p className="text-sm leading-6 text-muted">{room.group_label || 'Class'}: {room.group_name || room.class_name} · {room.unit_label || 'Topic'}: {room.unit_name || room.topic_name}</p></div><div className="flex flex-wrap gap-2 border-t border-border p-4"><Button size="sm" onClick={() => navigate(`/classroom/${room.id}`)} icon="door-open">Enter</Button><Button size="sm" variant="danger" onClick={() => handleEndRoom(room.id)} loading={endingRoomId === room.id} loadingLabel="Ending…" icon="stop">End</Button></div></article>; })}</div>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
