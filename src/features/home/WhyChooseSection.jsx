import WhyChooseIllustration from './WhyChooseIllustration';

 /* features/home/WhyChooseSection.jsx */

const REASONS = [
  {
    number: '01',
    title: 'Resources for Your Syllabus',
    text: 'Find notes, questions and revision materials that follow the topics you are studying.',
    color: 'blue',
    label: 'Curriculum aligned'
  },
  {
    number: '02',
    title: 'Learning That Fits Your Level',
    text: 'Choose your class or programme to keep your study materials relevant to what you need to learn.',
    color: 'green',
    label: 'Focused learning'
  },
  {
    number: '03',
    title: 'Study, Practise, Remember',
    text: 'Read a topic, test yourself with questions, and revisit the parts you find difficult.',
    color: 'amber',
    label: 'Learn · Recall · Practise'
  },
  {
    number: '04',
    title: 'Know What to Study Next',
    text: 'Find your subject and topic without having to search through unrelated materials.',
    color: 'grey',
    label: 'Organized by design'
  },
  {
    number: '05',
    title: 'Go Beyond Reading',
    text: 'Close your notes and see what you can remember. Your answers can show you what to review next.',
    color: 'blue',
    label: 'Active learning'
  },
  {
    number: '06',
    title: 'Get Help When You Need It',
    text: 'When you get stuck, explore the available classroom and tutor options for extra guidance.',
    color: 'green',
    label: 'Support when needed'
  }
];

export function WhyChooseSection() {

  return (
    <section className="section why-choose-section">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Why AliverBiopharm</span>

          <h2>A Better Way to Study</h2>

          <p>
            A focused learning environment built to help Biology and Pharmacy
            students learn, practise, recall and prepare with the right content
            at the right level.
          </p>
          <div className="why-choose-illustration"><WhyChooseIllustration /></div>
        </div>
      </div>

      <div className="why-choose-grid">
        {REASONS.map((reason) => (
          <article
            key={reason.number}
            className={`why-choose-card card-surface-solid card-elevation-none card-density-spacious why-choose-card-${reason.color}`}
          >
            <div className="why-choose-card-top">
              <span className="why-choose-number">
                {reason.number}
              </span>

              <span className="why-choose-label">
                {reason.label}
              </span>
            </div>

            <div className="why-choose-card-body">
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
