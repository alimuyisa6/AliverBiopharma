import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTutorDetail } from '../api/client';
import Icon from '../components/Icon/Icon';

export default function TutorProfile() {
  const { profileId } = useParams();
  const [tutor, setTutor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getTutorDetail(profileId).then((data) => active && setTutor(data)).catch((err) => active && setError(err?.message || 'Unable to load this tutor profile.'));
    return () => { active = false; };
  }, [profileId]);

  return (
    <main className="section tutor-profile-page">
      <div className="tutor-profile-shell">
        <Link to="/tutors" className="tutor-profile-back"><Icon name="arrow-left" /> Back to tutors</Link>
        {error ? <div className="card tutor-profile-state"><h1>Tutor profile unavailable</h1><p>{error}</p></div> :
          !tutor ? <div className="card tutor-profile-state" aria-busy="true"><h1>Loading tutor profile…</h1></div> :
          <article className="card tutor-profile-card">
            <header className="tutor-profile-header">
              <div className="tutor-profile-avatar">{tutor.avatar_url ? <img src={tutor.avatar_url} alt="" /> : <Icon name="user-graduate" />}</div>
              <div><p className="eyebrow">Tutor profile</p><h1>{tutor.display_name}</h1>{tutor.headline && <p>{tutor.headline}</p>}</div>
            </header>
            {tutor.bio && <section><h2>About</h2><p>{tutor.bio}</p></section>}
            <section className="tutor-profile-details">
              {tutor.years_experience != null && <div><span>Experience</span><strong>{tutor.years_experience} years</strong></div>}
              {(tutor.district || tutor.country) && <div><span>Location</span><strong>{[tutor.district, tutor.country].filter(Boolean).join(', ')}</strong></div>}
              {tutor.teaching_mode && <div><span>Teaching mode</span><strong>{tutor.teaching_mode}</strong></div>}
              {tutor.hourly_rate ? <div><span>Hourly rate</span><strong>{tutor.hourly_rate}</strong></div> : null}
            </section>
          </article>}
      </div>
    </main>
  );
}