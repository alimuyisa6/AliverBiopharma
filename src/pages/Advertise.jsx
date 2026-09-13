/* src/pages/Advertise.jsx */
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import { useLayout } from '../contexts/LayoutContext';

const BENEFITS = [
  {
    icon: 'audience',
    title: 'Relevant learners',
    description: 'Target by learning level, class or programme.',
  },
  {
    icon: 'campaign',
    title: 'Clear campaigns',
    description: 'Present your message with a focused headline and creative.',
  },
  {
    icon: 'review',
    title: 'Responsible advertising',
    description: 'Every campaign is reviewed before it goes live.',
  },
];

const PROGRAMMES = [
  {
    title: 'Biology O-Level',
    description: 'Learners studying Biology at ordinary secondary level.',
  },
  {
    title: 'Biology A-Level',
    description: 'Learners pursuing advanced Biology studies.',
  },
  {
    title: 'Pharmacy',
    description: 'Learners across our Pharmacy programmes.',
  },
];

export default function Advertise() {
  const { bootstrap } = useLayout();

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
            Put your message in front of
            <br />
            students who are paying attention.
          </h1>

          <p>
            Promote your organisation, programme or service to learners
            studying Biology and Pharmacy, at the moment they're most open
            to new opportunities.
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
            Built around our learners
          </span>

          <h2 id="advertise-programmes-title">
            Advertise where
            <br />
            learners are studying.
          </h2>

          <p>
            Match your campaign to the programme most relevant to your offer.
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
            Built for relevance,
            <br />
            not just reach.
          </h2>

          <p>
            Every part of the experience is designed around how learners
            actually discover opportunities.
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
            Create your campaign
            <br />
            in minutes.
          </h2>

          <p>
            Set your audience and placement, add your campaign details, then
            submit for review.
          </p>

          <Link
            to="/advertise/create"
            className="btn btn-primary"
          >
            Place Your Ad
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
            <h3>Reviewed before launch</h3>

            <p>
              We check each campaign for accuracy and relevance before it
              reaches learners.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
