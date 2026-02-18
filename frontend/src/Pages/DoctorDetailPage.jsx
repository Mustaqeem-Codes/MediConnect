import { Link, useParams } from 'react-router-dom';
import '../styles/DoctorDetailPage.css';

const DoctorDetailPage = () => {
  const { id } = useParams();
  const doctor = {
    id,
    name: 'Dr. Ava Smith',
    specialty: 'Cardiology',
    location: 'New York, NY',
    rating: 4.9,
    bio: 'Board-certified cardiologist focused on preventive care and heart health.',
    languages: ['English', 'Spanish'],
    nextAvailable: 'Tomorrow, 10:00 AM'
  };

  return (
    <div className="mc-doctor-detail">
      <header className="mc-doctor-detail__hero">
        <div>
          <p className="mc-doctor-detail__eyebrow">Doctor Profile</p>
          <h1>{doctor.name}</h1>
          <p className="mc-doctor-detail__subtitle">{doctor.specialty} · {doctor.location}</p>
        </div>
        <Link to={`/book/${doctor.id}`} className="mc-doctor-detail__cta">
          Book Appointment
        </Link>
      </header>

      <div className="mc-doctor-detail__grid">
        <section className="mc-doctor-detail__card">
          <h2>About</h2>
          <p>{doctor.bio}</p>
          <div className="mc-doctor-detail__tags">
            {doctor.languages.map((lang) => (
              <span key={lang}>{lang}</span>
            ))}
          </div>
        </section>

        <section className="mc-doctor-detail__card">
          <h2>Availability</h2>
          <p>Next available: {doctor.nextAvailable}</p>
          <div className="mc-doctor-detail__slots">
            <button>10:00 AM</button>
            <button>11:30 AM</button>
            <button>2:00 PM</button>
          </div>
        </section>

        <section className="mc-doctor-detail__card">
          <h2>Ratings</h2>
          <p>Average rating: {doctor.rating} / 5</p>
          <ul>
            <li>"Very attentive and caring."</li>
            <li>"Helped me understand my treatment."</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
