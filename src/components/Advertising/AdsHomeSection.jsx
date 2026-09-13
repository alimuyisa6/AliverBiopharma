/* src/components/Advertising/AdsHomeSection.jsx */
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import AdStepIcon from './AdStepIcon';
import { useLayout } from '../../contexts/LayoutContext';

const STEPS = [
  {
    number: '01',
    icon: 'organisation',
    title: 'Tell us about your organisation',
    description: 'Share who you are and what you’re offering learners.',
  },
  {
    number: '02',
    icon: 'campaign',
    title: 'Build your campaign',
    description: 'Add your message, image and destination link.',
  },
  {
    number: '03',
    icon: 'audience',
    title: 'Choose your audience',
    description: 'Target by learning level, class or programme.',
  },
  {
    number: '04',
    icon: 'placement',
    title: 'Choose your placement',
    description: 'Pick an available position and campaign duration.',
  },
  {
    number: '05',
    icon: 'review',
    title: 'Submit for review',
    description: 'Every campaign is checked for relevance and accuracy.',
  },
  {
    number: '06',
    icon: 'reach',
    title: 'Reach relevant learners',
    description: 'Once approved, your campaign goes live to the right audience.',
  },
];

const RULES = [
  'Content must relate to education, science, pharmacy or career opportunities.',
  'Campaigns can target Biology O-Level, Biology A-Level or Pharmacy programmes.',
  'Scholarships, academic events, training and other legitimate learner opportunities are welcome.',
  'Misleading, fraudulent, unsafe or unrelated advertising is not accepted.',
  'Health and pharmaceutical content must be accurate and appropriate for students.',
  'AliverBiopharm may decline or remove campaigns that don’t serve our learners.',
];

export default function AdsHomeSection() {
  const { bootstrap } = useLayout();

  const uiComponents = bootstrap?.ui_components || [];

  const component = uiComponents.find(
    (item) => item.component_key === 'ads_home_section'
  );

  const imageUrl =
    component?.properties?.image_url ||
    '/images/advertising-illustration.jpg';

  const imageAlt =
    component?.properties?.image_alt ||
    'Educational advertising opportunities for AliverBiopharm learners';

  return (
    <section
      className="section ads-home-section"
      aria-labelledby="ads-home-title"
    >
      <div className="ads-home-panel">
        <div className="ads-home-copy">
          <span className="ads-home-eyebrow">
            Advertising on AliverBiopharm
          </span>

          <h2 id="ads-home-title" className="ads-home-title">
            Advertising that reaches
            <br />
            <span>the right learners.</span>
          </h2>

          <div className="ads-home-description">
            <p>
              AliverBiopharm connects advertisers with learners studying
              Biology and Pharmacy. Campaigns can be targeted by learning
              level, class or programme.
            </p>

            <p>
              From scholarships and training opportunities to healthcare
              initiatives and educational resources, your message reaches an
              audience that's already engaged in learning.
            </p>
          </div>

          <div className="ads-home-actions">
            <Link
              to="/advertise"
              className="btn btn-primary ads-home-cta"
            >
              <span>Place Your Ad</span>
              <Icon name="arrow-right" />
            </Link>

            <Link
              to="/advertise"
              className="ads-home-secondary-link"
            >
              Learn how advertising works
            </Link>
          </div>
        </div>

        <div className="ads-home-visual">
          <div className="ads-home-image-frame">
            <img
              className="ads-home-image"
              src={imageUrl}
              alt={imageAlt}
              loading="lazy"
            />
          </div>

          <div className="ads-home-audience-note">
            <span className="ads-home-audience-label">
              Audience
            </span>

            <div className="ads-home-audience-list">
              <span>Biology O-Level</span>
              <span>Biology A-Level</span>
              <span>Pharmacy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ads-home-steps">
        <div className="ads-home-section-heading">
          <span className="eyebrow">How it works</span>

          <h2>
            Six steps from
            <br />
            concept to launch.
          </h2>

          <p>
            Set up your campaign, define your audience, and we'll handle the
            review.
          </p>
        </div>

        <div className="ads-home-step-grid">
          {STEPS.map((step) => (
            <article
              className="ads-home-step"
              key={step.number}
            >
              <div className="ads-home-step-top">
                <span className="ads-home-step-number">
                  {step.number}
                </span>

                <div className="ads-home-step-icon">
                  <AdStepIcon name={step.icon} />
                </div>
              </div>

              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="ads-home-rules">
        <div className="ads-home-rules-heading">
          <span className="eyebrow">Advertising standards</span>

          <h2>
            Advertising that respects
            <br />
            the classroom.
          </h2>

          <p>
            AliverBiopharm is a learning platform first. These standards keep
            it that way.
          </p>
        </div>

        <div className="ads-home-rules-list">
          {RULES.map((rule, index) => (
            <div
              className="ads-home-rule"
              key={rule}
            >
              <span className="ads-home-rule-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <p>{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
