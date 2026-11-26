import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getClassroomLevels,
  getClassroomTopics,
  applyAsTutor,
  getTutorStatus
} from '../api/client';
import Icon from '../components/Icon/Icon';
import StorysetIllustration from '../components/StorysetIllustration';
import Spinner from '../components/Spinner/Spinner';
import Button from '../components/Button/Button';
import Textarea from '../components/Textarea/Textarea';
import { useToast } from '../components/Toast/Toast';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

const LEVEL_ICON_TONES = ['bg-primary-100 text-primary-800', 'bg-secondary-100 text-secondary-800', 'bg-emerald-100 text-emerald-800'];

export default function TutorApply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToast = useToast();

  const [step, setStep] = useState(1);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [levelsData, statusRes] = await Promise.all([
          getClassroomLevels(),
          getTutorStatus()
        ]);

        setLevels(levelsData || []);

        if (statusRes?.application) setExistingApplication(statusRes.application);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (user?.profile?.track && levels.length && step === 1) {
      const matched = levels.find((lvl) => lvl.key === user.profile.track || lvl.display_name === user.profile.track);

      if (matched) {
        setSelectedLevel(matched);
        setStep(2);
      }
    }
  }, [user, levels, step]);

  function handleLevelSelect(level) {
    setSelectedLevel(level);
    setSelectedClass(null);
    setSelectedTopics([]);
    setStep(2);
  }

  async function handleClassSelect(cls) {
    const classObj = typeof cls === 'string' ? { id: cls, name: cls } : cls;

    setSelectedClass(classObj);
    setSelectedTopics([]);

    try {
      const data = await getClassroomTopics(classObj.id, selectedLevel.key);

      setTopics(data || []);
    } catch {
      setTopics([]);
    }

    setStep(3);
  }

  function toggleTopic(topicName) {
    setSelectedTopics((prev) =>
      prev.includes(topicName)
        ? prev.filter((topic) => topic !== topicName)
        : [...prev, topicName]
    );
  }

  async function handleSubmit() {
    const storedTrack = user?.profile?.track;
    const levelToSubmit = storedTrack || selectedLevel?.key;

    if (!levelToSubmit || !selectedClass || selectedTopics.length === 0) {
      addToast('Please complete all required fields before submitting.', 'error');
      return;
    }

    if (storedTrack && selectedLevel && selectedLevel.key !== storedTrack) {
      addToast('The selected teaching level doesn’t match your account level.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await applyAsTutor(
        levelToSubmit,
        selectedClass.name,
        selectedTopics,
        qualifications,
        experience
      );

      setSubmitted(true);
    } catch (err) {
      addToast(err.message || 'We couldn’t submit your application. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center bg-primary-50" aria-busy="true"><Spinner size="lg" /></main>;

  if (existingApplication) {
    const statusLabels = {
      pending: { label: 'Under review', tone: 'warning' },
      scheduled: { label: 'Interview scheduled', tone: 'primary' },
      interviewed: { label: 'Interview completed', tone: 'secondary' },
      approved: { label: 'Approved', tone: 'success' },
      rejected: { label: 'Rejected', tone: 'error' }
    };
    const status = statusLabels[existingApplication.status] || statusLabels.pending;
    const statusTone = { warning: 'bg-amber-100 text-amber-900', primary: 'bg-primary-100 text-primary-900', secondary: 'bg-secondary-100 text-secondary-900', success: 'bg-emerald-100 text-emerald-900', error: 'bg-red-100 text-red-900' }[status.tone];

    return (
      <main className="min-h-screen w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto grid w-full max-w-3xl gap-7">
          <PageHeader label="Tutor application" title="Application status" subtitle="Check the latest status of your tutor application." />
          <section className={`${UI.card} mx-auto grid w-full max-w-xl justify-items-center gap-5 p-6 text-center sm:p-8`}>
            <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${statusTone}`}><Icon name="circle-info" size="2rem" /></span>
            <h2 className="text-xl font-extrabold text-primary-900">{status.label}</h2>
            <div className="grid w-full gap-3 border-y border-border py-5 text-left text-sm text-slate-700"><p><strong>Level:</strong> {existingApplication.level}</p><p><strong>Class:</strong> {existingApplication.class_name}</p><p><strong>Subjects:</strong> {(existingApplication.subjects || []).join(', ')}</p>{existingApplication.rejection_reason && <p className="text-red-700"><strong>Reason:</strong> {existingApplication.rejection_reason}</p>}{existingApplication.interview_scheduled_at && <p><strong>Interview:</strong> {new Date(existingApplication.interview_scheduled_at).toLocaleString()}</p>}</div>
            <Button onClick={() => navigate('/tutor/dashboard')} icon="gauge-high">Tutor Dashboard</Button>
          </section>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-5 bg-primary-50 px-4 py-12 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon name="circle-check" size="2rem" /></span>
        <h1 className="text-3xl font-extrabold text-primary-900 sm:text-4xl">Application submitted</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted">Your application has been received. We’ll review it and update your status here.</p>
        <div className="flex flex-wrap justify-center gap-3"><Button onClick={() => navigate('/tutor/dashboard')} icon="gauge-high">Go to Tutor Dashboard</Button><Button variant="secondary" onClick={() => navigate('/classroom')} icon="users">Back to Classrooms</Button></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <header className="grid items-center gap-5 border-b border-border pb-7 sm:grid-cols-[minmax(0,1fr)_150px]">
          <PageHeader label="Tutor application" title="Apply to become a tutor" subtitle="Share your knowledge and help learners succeed. Complete the steps below to apply." />
          <StorysetIllustration name="careerProgress" alt="Career growth through tutoring" className="mx-auto hidden w-36 shrink-0 object-contain sm:block" />
        </header>

        <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-8" aria-label="Application steps">
          {[1, 2, 3].map((number) => <div key={number} className="flex items-center gap-3"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${step >= number ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-600'}`}>{number}</span><span className={`text-sm font-semibold ${step >= number ? 'text-primary-900' : 'text-muted'}`}>{number === 1 ? 'Level' : number === 2 ? 'Class' : 'Subjects'}</span></div>)}
        </nav>

        {step === 1 && !user?.profile?.track && (
          <section className="grid gap-5"><h2 className="text-xl font-extrabold text-primary-900">Choose the level you’d like to teach</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{levels.map((level, index) => <article key={level.key} className={`${UI.card} grid gap-4 p-5 text-center`}><span className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ${LEVEL_ICON_TONES[index % LEVEL_ICON_TONES.length]}`}><Icon name={level.icon === 'dna' ? 'microscope' : level.icon || 'graduation-cap'} size="2rem" /></span><h3 className="text-lg font-extrabold text-primary-900">{level.key}</h3><Button size="sm" onClick={() => handleLevelSelect(level)}>Select</Button></article>)}</div></section>
        )}

        {step === 2 && selectedLevel && (
          <section className="grid gap-5"><Button variant="ghost" className="w-fit" onClick={() => setStep(1)} icon="arrow-left">Back</Button><h2 className="text-xl font-extrabold text-primary-900">Choose the class you’d like to teach in {selectedLevel.key}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{(selectedLevel.classes || []).map((cls, index) => { const name = typeof cls === 'string' ? cls : cls.name; const icon = typeof cls === 'object' ? cls.icon : null; return <article key={name} className={`${UI.card} grid gap-4 p-5 text-center`}><span className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ${LEVEL_ICON_TONES[index % LEVEL_ICON_TONES.length]}`}><Icon name={icon === 'dna' ? 'microscope' : icon || 'book-open'} size="2rem" /></span><h3 className="text-lg font-extrabold text-primary-900">{name}</h3><Button size="sm" onClick={() => handleClassSelect(cls)}>Select</Button></article>; })}</div></section>
        )}

        {step === 3 && (
          <section className="grid gap-5"><Button variant="ghost" className="w-fit" onClick={() => setStep(2)} icon="arrow-left">Back</Button><h2 className="text-xl font-extrabold text-primary-900">Choose the topics you can teach in {selectedClass?.name}</h2>
            {topics.length === 0 ? <p className="rounded-xl bg-white p-4 text-sm text-muted">No topics available for this class.</p> : <div className="flex flex-wrap gap-3">{topics.map((topic) => <Button key={topic.id} variant={selectedTopics.includes(topic.topic_name) ? 'primary' : 'secondary'} onClick={() => toggleTopic(topic.topic_name)} icon={selectedTopics.includes(topic.topic_name) ? 'square-check' : 'square'}>{topic.topic_name}{topic.is_hard_topic && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">Hard</span>}</Button>)}</div>}
            <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6"><Textarea label="Qualifications" placeholder="Describe your qualifications..." value={qualifications} onChange={(event) => setQualifications(event.target.value)} rows={4} /><Textarea label="Teaching Experience" placeholder="Describe your teaching experience..." value={experience} onChange={(event) => setExperience(event.target.value)} rows={4} /><div className="flex justify-end border-t border-border pt-4"><Button onClick={handleSubmit} loading={submitting} disabled={selectedTopics.length === 0} icon="paper-plane">Submit application</Button></div></div>
          </section>
        )}
      </div>
    </main>
  );
}
