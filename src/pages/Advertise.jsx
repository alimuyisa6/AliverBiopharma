/* src/pages/Advertise.jsx */
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import { useLayout } from '../contexts/LayoutContext';
import { useI18n } from '../contexts/I18nContext';

const BENEFITS = [
  {
    icon: 'audience',
    title: 'Relevant learners',
    description: 'Target learners by Biology level, school class, and Pharmacy programme.',
  },
  {
    icon: 'campaign',
    title: 'Clear campaigns',
    description: 'Present your offer with a clear headline and campaign artwork.',
  },
  {
    icon: 'review',
    title: 'Responsible advertising',
    description: 'Every campaign is checked before it appears to learners.',
  },
];

const PROGRAMMES = [
  {
    title: 'Biology O-Level',
    description: 'Students studying O-Level Biology in Forms 1–4.',
  },
  {
    title: 'Biology A-Level',
    description: 'Students studying A-Level Biology in Forms 5–6.',
  },
  {
    title: 'Pharmacy',
    description: 'Students enrolled in Pharmacy Certificate, Diploma, and Degree programmes.',
  },
];

export default function Advertise() {
  const { bootstrap } = useLayout();
  const { t } = useI18n();

  const uiComponents = bootstrap?.ui_components || [];

  const component = uiComponents.find(
    (item) => item.component_key === 'advertise_hero'
  );

  const imageUrl =
    component?.properties?.image_url ||
    '/images/advertise-hero.jpg';

  const imageAlt =
    component?.properties?.image_alt ||
    'Reach relevant learners through AliverBiopharm advertising';

  return (
    <main className="advertise-page">
      <section className="advertise-hero">
        <div className="advertise-hero-copy">
          <span className="eyebrow">
            Advertise with AliverBiopharm
          </span>

          <h1>
            Reach
            <br />
            learners who are ready to discover opportunities.
          </h1>

          <p>
            Introduce your organisation to learners studying Biology and Pharmacy.
          </p>

          <div className="advertise-hero-actions">
            <a
              href="#start"
              className="btn btn-primary"
            >
              Start your campaign
            </a>

            <a
              href="#how-it-works"
              className="advertise-text-link"
            >
              See how it works
            </a>
          </div>
        </div>

        <div
          className="advertise-hero-visual"
          aria-hidden="true"
        >
          <img
            className="advertise-hero-image"
            src={imageUrl}
            alt={imageAlt}
          />
        </div>
      </section>

      <section
        className="advertise-programmes"
        aria-labelledby="advertise-programmes-title"
      >
        <div className="advertise-section-heading">
          <span className="eyebrow">
            Reach the right learners
          </span>

          <h2 id="advertise-programmes-title">
            Reach learners where
            <br />
            they study.
          </h2>

          <p>
            Select the learner group you want your campaign to reach.
          </p>
        </div>

        <div className="advertise-programme-list">
          {PROGRAMMES.map((programme, index) => (
            <article
              className="advertise-programme"
              key={programme.title}
            >
              <span className="advertise-programme-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div>
                <h3>{programme.title}</h3>

                <p>{programme.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="advertise-benefits"
        id="how-it-works"
        aria-labelledby="advertise-benefits-title"
      >
        <div className="advertise-section-heading">
          <span className="eyebrow">
            Why advertise here
          </span>

          <h2 id="advertise-benefits-title">
            Reach the right learners,
            <br />
            with a relevant message.
          </h2>

          <p>
            Show learners opportunities that match their studies and career goals.
          </p>
        </div>

        <div className="advertise-benefit-list">
          {BENEFITS.map((benefit) => (
            <article
              className="advertise-benefit"
              key={benefit.title}
            >
              <div className="advertise-benefit-icon">
                <AdStepIcon name={benefit.icon} />
              </div>

              <h3>{benefit.title}</h3>

              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="advertise-process"
        id="start"
      >
        <div className="advertise-process-heading">
          <span className="eyebrow">
            Ready when you are
          </span>

          <h2>
            Set up your campaign
            <br />
            in a few steps.
          </h2>

          <p>
            Select your audience and ad placement, enter your campaign details, then submit it for review.
          </p>

          <Link
            to="/advertise/create"
            className="btn btn-primary"
          >
            Create campaign
            <Icon name="arrow-right" />
          </Link>
        </div>

        <div className="advertise-process-note">
          <div className="advertise-process-note-icon">
            <AdStepIcon
              name="review"
              size={34}
            />
          </div>

          <div>
            <h3>Reviewed before it goes live</h3>

            <p>
              We check each campaign for accuracy and relevance before it appears on the site.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
