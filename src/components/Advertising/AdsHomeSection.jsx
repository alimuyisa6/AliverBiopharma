/* src/components/Advertising/AdsHomeSection.jsx */
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import AdvertisingReachIllustration from './AdvertisingReachIllustration';
import { useLayout } from '../../contexts/LayoutContext';

export default function AdsHomeSection() {
  const { bootstrap } = useLayout();


  return (
    <section
      className="section ads-home-section"
      aria-labelledby="ads-home-title"
    >
      <div className="ads-home-panel">
        <div className="ads-home-copy">
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
        </div>

        <div className="ads-home-visual">
          <div className="ads-home-image-frame ads-home-illustration-frame">
            <AdvertisingReachIllustration />
          </div>

          <Link
            to="/advertise"
            className="btn btn-primary ads-home-cta"
          >
            <span>Place Your Ad</span>
            <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
