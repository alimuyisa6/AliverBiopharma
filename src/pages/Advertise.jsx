/* src/pages/Advertise.jsx */

import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';

const BENEFITS = [
{
icon: 'audience',
title: 'Relevant learners',
description:
'Reach learners according to the learning level, class or programme that matches your campaign.',
},
{
icon: 'campaign',
title: 'Clear campaigns',
description:
'Present your organisation, opportunity or educational service with a focused message and creative.',
},
{
icon: 'review',
title: 'Responsible advertising',
description:
'Campaigns go through a review process designed to protect the quality and trust of the learning environment.',
},
];

const PROGRAMMES = [
{
title: 'Biology O-Level',
description:
'Reach learners studying Biology at the ordinary secondary level.',
},
{
title: 'Biology A-Level',
description:
'Connect with learners pursuing advanced Biology studies.',
},
{
title: 'Pharmacy',
description:
'Reach learners across relevant Pharmacy programmes.',
},
];

export default function Advertise() {
return (
<main className="advertise-page">
<section className="advertise-hero">
<div className="advertise-hero-copy">
<span className="eyebrow">
Advertise with AliverBiopharm
</span>

      <h1>
        Reach the learners
        <br />
        who matter to you.
      </h1>

      <p>
        Connect your organisation, opportunity or educational service with
        learners across Biology and Pharmacy programmes on AliverBiopharm.
      </p>

      <div className="advertise-hero-actions">
        <a href="#start" className="btn btn-primary">
          Start your campaign
          <Icon name="arrow-right" />
        </a>

        <a
          href="#how-it-works"
          className="advertise-text-link"
        >
          See how it works
          <Icon name="arrow-down" />
        </a>
      </div>
    </div>

    <div
      className="advertise-hero-visual"
      aria-hidden="true"
    >
      <div className="advertise-hero-art">
        <div className="advertise-hero-art-line" />

        <div className="advertise-hero-art-panel">
          <span>Reach</span>
          <strong>Relevant</strong>
          <span>Learners</span>
        </div>

        <div className="advertise-hero-art-mark">
          <AdStepIcon name="audience" size={42} />
        </div>
      </div>
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
        Advertise where your
        <br />
        audience is learning.
      </h2>

      <p>
        Campaigns can be matched with the learning areas supported by
        AliverBiopharm.
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

          <Icon name="arrow-right" />
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
        Why advertise here?
      </span>

      <h2 id="advertise-benefits-title">
        More than visibility.
        <br />
        Better relevance.
      </h2>

      <p>
        Our advertising experience is designed around the way learners
        discover useful opportunities and resources.
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
        in a few clear steps.
      </h2>

      <p>
        Choose your audience and placement, provide your campaign details,
        then submit everything for review.
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
        <h3>Every campaign is reviewed</h3>

        <p>
          Advertising on an education platform comes with responsibility.
          We review campaigns before they become active to help maintain a
          useful and trustworthy learning environment.
        </p>
      </div>
    </div>
  </section>
</main>

);
}
