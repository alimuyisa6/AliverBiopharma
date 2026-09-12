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
    description:
      'Introduce your institution, business, programme or opportunity so we can understand what you are offering learners.',
  },
  {
    number: '02',
    icon: 'campaign',
    title: 'Build your campaign',
    description:
      'Add your campaign message, image, destination and the information learners need to understand your offer.',
  },
  {
    number: '03',
    icon: 'audience',
    title: 'Choose your audience',
    description:
      'Select the learning level and, where appropriate, the class or programme you want your campaign to reach.',
  },
  {
    number: '04',
    icon: 'placement',
    title: 'Choose your placement',
    description:
      'Select an available advertising position and campaign duration that fits your communication goals.',
  },
  {
    number: '05',
    icon: 'review',
    title: 'Submit for review',
    description:
      'Every campaign is reviewed to help keep advertising relevant, trustworthy and appropriate for an educational environment.',
  },
  {
    number: '06',
    icon: 'reach',
    title: 'Reach relevant learners',
    description:
      'Once approved and active, your campaign can be shown to learners within the audience and placement you selected.',
  },
];

const RULES = [
  'Advertising must be relevant to education, learning, science, pharmacy, careers or other appropriate learner opportunities.',
  'Campaigns may be aligned with Biology O-Level, Biology A-Level or Pharmacy programmes and their relevant classes or programmes.',
  'Scholarships, bursaries, academic events, professional training, internships and appropriate educational services may be advertised.',
  'Misleading claims, fraudulent opportunities, unsafe products or services, explicit content, gambling and unrelated advertising are not accepted.',
  'Health and pharmaceutical advertising must be responsible, accurate and appropriate for the educational audience.',
  'AliverBiopharm may decline, pause or remove campaigns that conflict with learner safety, trust or the platform’s educational purpose.',
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
            Need to reach the
            <br />
            right learners?
            <br />
            <span>Aliver is the solution.</span>
          </h2>

          <div className="ads-home-description">
            <p>
              AliverBiopharm connects advertisers with learners across Biology
              O-Level, Biology A-Level and Pharmacy programmes.
            </p>

            <p>
              Whether you are promoting an educational institution,
              scholarship, training opportunity, career service, healthcare
              initiative or relevant educational resource, your message can be
              presented to the audience it is designed for.
            </p>

            <p>
              Our advertising system allows campaigns to be aligned with
              learning levels, classes and programmes while keeping the
              platform focused on useful and responsible educational
              opportunities.
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
              <Icon name="arrow-right" />
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
          <span className="eyebrow">A simple process</span>

          <h2>
            From your idea
            <br />
            to the right audience.
          </h2>

          <p>
            Set up your campaign, choose who you want to reach and let the
            review process take care of the rest.
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
          <span className="eyebrow">Before you advertise</span>

          <h2>
            Advertising should
            <br />
            serve the learner too.
          </h2>

          <p>
            AliverBiopharm is an education platform. Our advertising standards
            help protect the quality, relevance and trust of the learning
            environment.
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
