// frontend/src/components/home/Hero.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/home/Hero.css';
import heroImage from '../../assets/hero-image.webp';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
    years: 0
  });

  // Animate stats on load
  useEffect(() => {
    const targetStats = {
      doctors: 500,
      patients: 50000,
      appointments: 100000,
      years: 10
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = {};

    Object.keys(targetStats).forEach(key => {
      increment[key] = targetStats[key] / steps;
    });

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setStats(prev => ({
          doctors: Math.min(Math.floor(prev.doctors + increment.doctors), targetStats.doctors),
          patients: Math.min(Math.floor(prev.patients + increment.patients), targetStats.patients),
          appointments: Math.min(Math.floor(prev.appointments + increment.appointments), targetStats.appointments),
          years: Math.min(Math.floor(prev.years + increment.years), targetStats.years)
        }));
        currentStep++;
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const specialties = [
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Neurologist',
    'Orthopedic',
    'Gynecologist',
    'Psychiatrist',
    'Dentist',
    'Eye Specialist',
    'General Physician'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Will connect to backend later
    console.log('Searching:', { searchQuery, selectedSpecialty, location });
  };

  return (
    <section className="mc-hero">
      <div className="mc-hero__container">
        <div className="mc-hero__grid">
          {/* Left Content */}
          <div className="mc-hero__content">
            <div className="mc-hero__trust-badge">
              <span className="mc-hero__badge-icon">✓</span>
              <span className="mc-hero__badge-text">Trusted by 50,000+ patients worldwide</span>
            </div>

            <h1 className="mc-hero__title">
              Your Health, 
              <span className="mc-hero__title-highlight"> Our Priority</span>
            </h1>

            <p className="mc-hero__subtitle">
              Connect with top specialists, book appointments instantly, 
              and manage your health journey - all in one secure platform.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mc-hero__search-form">
              <div className="mc-hero__search-grid">
                <div className="mc-hero__search-field">
                  <label htmlFor="specialty" className="mc-hero__field-label">
                    <span className="mc-hero__label-icon">👨‍⚕️</span>
                    Specialty
                  </label>
                  <select
                    id="specialty"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="mc-hero__search-select"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="mc-hero__search-field">
                  <label htmlFor="location" className="mc-hero__field-label">
                    <span className="mc-hero__label-icon">📍</span>
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    placeholder="Enter city or zip code"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mc-hero__search-input"
                  />
                </div>

                <div className="mc-hero__search-field">
                  <label htmlFor="doctor" className="mc-hero__field-label">
                    <span className="mc-hero__label-icon">🔍</span>
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    id="doctor"
                    placeholder="Search by doctor name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mc-hero__search-input"
                  />
                </div>
              </div>

              <button type="submit" className="mc-hero__search-button">
                <span className="mc-hero__button-text">Find Doctor</span>
                <span className="mc-hero__button-icon">→</span>
              </button>
            </form>

            {/* Trust Indicators */}
            <div className="mc-hero__trust-indicators">
              <div className="mc-hero__trust-item">
                <span className="mc-hero__trust-icon">✓</span>
                <span className="mc-hero__trust-text">Verified Doctors</span>
              </div>
              <div className="mc-hero__trust-item">
                <span className="mc-hero__trust-icon">✓</span>
                <span className="mc-hero__trust-text">Secure Payments</span>
              </div>
              <div className="mc-hero__trust-item">
                <span className="mc-hero__trust-icon">✓</span>
                <span className="mc-hero__trust-text">24/7 Support</span>
              </div>
              <div className="mc-hero__trust-item">
                <span className="mc-hero__trust-icon">✓</span>
                <span className="mc-hero__trust-text">Instant Booking</span>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mc-hero__stats-container">
              <div className="mc-hero__stat-item">
                <div className="mc-hero__stat-number">{stats.doctors.toLocaleString()}+</div>
                <div className="mc-hero__stat-label">Expert Doctors</div>
              </div>
              <div className="mc-hero__stat-item">
                <div className="mc-hero__stat-number">{stats.patients.toLocaleString()}+</div>
                <div className="mc-hero__stat-label">Happy Patients</div>
              </div>
              <div className="mc-hero__stat-item">
                <div className="mc-hero__stat-number">{stats.appointments.toLocaleString()}+</div>
                <div className="mc-hero__stat-label">Appointments</div>
              </div>
              <div className="mc-hero__stat-item">
                <div className="mc-hero__stat-number">{stats.years}+</div>
                <div className="mc-hero__stat-label">Years Experience</div>
              </div>
            </div>
          </div>

          {/* Right Content - Image/Illustration */}
          <div className="mc-hero__image-wrapper">
            <div className="mc-hero__image-container">
              <div className="mc-hero__image">
                <img 
                  src={heroImage}
                  alt="Doctor consulting patient"
                  className="mc-hero__img"
                />
              </div>

              {/* Floating Cards */}
              <div className="mc-hero__floating-card mc-hero__floating-card--1">
                <div className="mc-hero__card-icon">👨‍⚕️</div>
                <div className="mc-hero__card-content">
                  <div className="mc-hero__card-title">Top Specialists</div>
                  <div className="mc-hero__card-subtitle">500+ doctors</div>
                </div>
              </div>

              <div className="mc-hero__floating-card mc-hero__floating-card--2">
                <div className="mc-hero__card-icon">⭐</div>
                <div className="mc-hero__card-content">
                  <div className="mc-hero__card-title">4.9 Rating</div>
                  <div className="mc-hero__card-subtitle">from 50k+ reviews</div>
                </div>
              </div>

              <div className="mc-hero__floating-card mc-hero__floating-card--3">
                <div className="mc-hero__card-icon">📅</div>
                <div className="mc-hero__card-content">
                  <div className="mc-hero__card-title">Instant Booking</div>
                  <div className="mc-hero__card-subtitle">No waiting</div>
                </div>
              </div>

              <div className="mc-hero__floating-card mc-hero__floating-card--4">
                <div className="mc-hero__card-icon">🔒</div>
                <div className="mc-hero__card-content">
                  <div className="mc-hero__card-title">HIPAA Secure</div>
                  <div className="mc-hero__card-subtitle">100% privacy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;