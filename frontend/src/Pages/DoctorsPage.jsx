import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DoctorsPage.css';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:5000/api/doctors');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load doctors');
        }

        setDoctors(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    const nameFilter = query.trim().toLowerCase();
    const cityFilter = city.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesName = nameFilter
        ? doctor.name.toLowerCase().includes(nameFilter)
        : true;
      const matchesSpecialty = specialty
        ? doctor.specialty === specialty
        : true;
      const matchesCity = cityFilter
        ? (doctor.location || '').toLowerCase().includes(cityFilter)
        : true;
      return matchesName && matchesSpecialty && matchesCity;
    });
  }, [doctors, query, specialty, city]);

  return (
    <div className="mc-doctors">
      <header className="mc-doctors__hero">
        <div>
          <p className="mc-doctors__eyebrow">Find a Specialist</p>
          <h1 className="mc-doctors__title">Browse trusted doctors near you.</h1>
          <p className="mc-doctors__subtitle">
            Filter by specialty, location, and availability to book your next appointment.
          </p>
        </div>
        <div className="mc-doctors__filters">
          <input
            className="mc-doctors__input"
            placeholder="Search by name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="mc-doctors__select"
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
          >
            <option value="">All specialties</option>
            <option>Cardiologist</option>
            <option>Dermatologist</option>
            <option>Neurologist</option>
            <option>General Physician</option>
          </select>
          <input
            className="mc-doctors__input"
            placeholder="City or ZIP"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <button className="mc-doctors__cta" type="button">Search</button>
        </div>
      </header>

      {loading && <div className="mc-doctors__state">Loading doctors...</div>}
      {error && <div className="mc-doctors__error">{error}</div>}

      {!loading && !error && (
        <section className="mc-doctors__grid">
          {filteredDoctors.length === 0 ? (
            <div className="mc-doctors__empty">No doctors match your filters.</div>
          ) : (
            filteredDoctors.map((doctor) => (
              <article key={doctor.id} className="mc-doctors__card">
                <div className="mc-doctors__avatar">{doctor.name.slice(0, 2)}</div>
                <div className="mc-doctors__info">
                  <h2>{doctor.name}</h2>
                  <p>{doctor.specialty}</p>
                  <span>{doctor.location || 'Location TBD'}</span>
                </div>
                <div className="mc-doctors__meta">
                  <span>Status: {doctor.is_approved ? 'Approved' : 'Pending'}</span>
                  <span>Verified: {doctor.is_verified ? 'Yes' : 'No'}</span>
                </div>
                <Link to={`/doctors/${doctor.id}`} className="mc-doctors__book">
                  View Profile
                </Link>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorsPage;
