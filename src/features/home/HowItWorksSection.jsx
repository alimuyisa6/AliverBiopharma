import { useLayout } from '../../contexts/LayoutContext';

const STEPS = [
  {
    number: '01',
    componentKey: 'how_it_works_account_icon',
    title: 'Create your account',
    text: 'Choose O-Level, A-Level, or Pharmacy to see learning resources for your course.'
  },
  {
    number: '02',
    componentKey: 'how_it_works_study_icon',
    title: 'Study with purpose',
    text: 'Use focused notes, flashcards, quizzes, and recall practice to make each study session count.'
  },
  {
    number: '03',
    componentKey: 'how_it_works_progress_icon',
    title: 'Build your progress',
    text: 'Review the topics that need work, practise again, and track how far you have come.'
  }
];

export function HowItWorksSection() {
  const { bootstrap } = useLayout();

  const uiComponents = bootstrap?.ui_components || [];

  return (
    <section className="section how-it-works-section">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">HOW TO GET STARTED ON OUR PLATFORM</span>

          <h2>Start learning in three simple steps</h2>

          <p className="section-description">
            Choose your course, study the right topics, and practise until the ideas stick.
          </p>
        </div>
      </div>

      <div className="how-it-works-grid">
        {STEPS.map((step) => {
          const component = uiComponents.find(
            (item) => item.component_key === step.componentKey
          );

          const imageUrl = component?.properties?.image_url || component?.image_url || null;
          const altText = component?.properties?.alt_text || step.title;

          return (
            <article key={step.number} className="how-step">
              <div className="how-step-top">
                <span className="how-step-number">
                  {step.number}
                </span>

                {imageUrl && (
                  <div className="how-step-icon">
                    <img
                      src={imageUrl}
                      alt={altText}
                      className="how-step-icon-image"
                    />
                  </div>
                )}
              </div>

              <div className="how-step-content">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
