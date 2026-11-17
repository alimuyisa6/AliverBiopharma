 // pages/ClassroomOnboarding.jsx
import React, { useState, useEffect } from 'react';
import { getClassroomLevels, getClassroomTopics } from '../../api/cachedClient';

const CARD_COLOR_CLASS = [
  'level-card-blue',
  'level-card-teal',
  'level-card-violet',
  'level-card-mint',
  'level-card-emerald',
];

export function ClassroomOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    getClassroomLevels().then(setLevels).finally(() => setLoadingLevels(false));
  }, []);

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setSelectedClass(null);
    setSelectedTopic(null);
    setStep(2);
  };

  const handleClassSelect = async (cls) => {
    const className = typeof cls === 'string' ? cls : cls.id;
    setSelectedClass(cls);
    setSelectedTopic(null);
    setStep(3);
    setLoadingTopics(true);
    try {
      const data = await getClassroomTopics(selectedLevel.key, className);
      setTopics(data || []);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setSelectedClass(null);
      setSelectedTopic(null);
      setTopics([]);
      setStep(2);
    } else if (step === 2) {
      setSelectedLevel(null);
      setSelectedClass(null);
      setSelectedTopic(null);
      setStep(1);
    }
  };

  const handleJoin = () => {
    if (onComplete) {
      onComplete({
        level: selectedLevel.key,
        class_name: typeof selectedClass === 'string' ? selectedClass : selectedClass.id,
        topic: selectedTopic,
      });
    }
  };

  if (loadingLevels) {
    return <div className="flex min-h-40 items-center justify-center text-primary-700"><i className="fa-solid fa-spinner fa-spin"></i></div>;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        {[1, 2, 3].map((n) => (
          <React.Fragment key={n}>
            <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${step >= n ? "bg-primary-700 text-white" : "bg-background text-slate-500"}`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{n}</span>
              <span className="text-sm font-semibold">{n === 1 ? 'Level' : n === 2 ? 'Class' : 'Topic'}</span>
            </div>
            {n < 3 && <div className="hidden h-px min-w-6 flex-1 bg-border sm:block"></div>}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <h3>Select Your Level</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((lvl, i) => (
              <article
                key={lvl.key}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selectedLevel?.key === lvl.key ? "border-primary-500 ring-2 ring-primary-100" : "border-border hover:border-primary-300"}`}
              >
                {lvl.image_url && (
                  <div className="aspect-[16/9] overflow-hidden bg-primary-50">
                    <img src={lvl.image_url} alt={lvl.key} loading="lazy" />
                  </div>
                )}
                <div className="flex min-h-24 items-center gap-3 p-4 text-base font-bold text-primary-950">
                  <i className={`fa-solid ${lvl.icon}`}></i>
                  <span>{lvl.key}</span>
                </div>
                <button type="button" className="m-4 mt-0 min-h-10 rounded-lg bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800" onClick={() => handleLevelSelect(lvl)}>Select level</button>
              </article>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedLevel && (
        <div className="onboarding-body">
          <button className="onboarding-back" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <h3>Select Your Class</h3>
          <div className="onboarding-grid">
            {selectedLevel.classes.map((cls, i) => {
              const isObj = typeof cls !== 'string';
              const key = isObj ? cls.id : cls;
              const label = isObj ? cls.name : cls;
              const imageUrl = isObj ? cls.image_url : null;
              return (
                <article
                  key={key}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selectedClass === cls ? "border-primary-500 ring-2 ring-primary-100" : "border-border hover:border-primary-300"}`}
                >
                  {imageUrl && (
                    <div className="onboarding-card-media">
                      <img src={imageUrl} alt={label} loading="lazy" />
                    </div>
                  )}
                  <div className="onboarding-card-body">
                    <i className={`fa-solid ${isObj ? cls.icon || 'fa-mortar-pestle' : selectedLevel.icon}`}></i>
                    <span>{label}</span>
                  </div>
                  <button type="button" className="onboarding-card-select" onClick={() => handleClassSelect(cls)}>Select class</button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-body">
          <button className="onboarding-back" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <h3>Select a Topic</h3>
          {loadingTopics ? (
            <div className="classroom-loading"><i className="fa-solid fa-spinner fa-spin"></i></div>
          ) : topics.length === 0 ? (
            <div className="onboarding-empty">No topics available for this class.</div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topics.map((topic) => (
                <article
                  key={topic.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${selectedTopic?.id === topic.id ? "border-primary-500 bg-primary-50" : "border-border bg-white hover:border-primary-300"}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {topic.is_hard_topic ? (
                      <i className="fa-solid fa-triangle-exclamation topic-icon-hard"></i>
                    ) : (
                      <i className="fa-solid fa-book-open topic-icon-normal"></i>
                    )}
                    <span className="min-w-0 text-sm font-bold text-primary-950">{topic.topic_name}</span>
                    {topic.is_hard_topic && <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-1 text-xs font-bold text-secondary-900">Hard Topic</span>}
                  </div>
                  <button type="button" className="min-h-9 shrink-0 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-800 hover:bg-primary-50" onClick={() => setSelectedTopic(topic)}>
                    {selectedTopic?.id === topic.id ? 'Selected' : 'Select topic'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTopic && (
        <div className="mt-6 flex justify-end">
          <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white hover:bg-primary-800" onClick={handleJoin}>
            <i className="fa-solid fa-door-open"></i> Find Classrooms
          </button>
        </div>
      )}
    </div>
  );
}
