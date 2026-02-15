// frontend/src/components/home/Stats.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/home/Stats.css';

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    cities: 0,
    countries: 0,
    satisfaction: 0
  });

  const statsRef = useRef(null);

  // Target values
  const targets = {
    patients: 50000,
    doctors: 500,
    appointments: 100000,
    cities: 150,
    countries: 25,
    satisfaction: 98
  };

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate counters
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increments = {};

    Object.keys(targets).forEach(key => {
      increments[key] = targets[key] / steps;
    });

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setCounts(prev => ({
          patients: Math.min(Math.floor(prev.patients + increments.patients), targets.patients),
          doctors: Math.min(Math.floor(prev.doctors + increments.doctors), targets.doctors),
          appointments: Math.min(Math.floor(prev.appointments + increments.appointments), targets.appointments),
          cities: Math.min(Math.floor(prev.cities + increments.cities), targets.cities),
          countries: Math.min(Math.floor(prev.countries + increments.countries), targets.countries),
          satisfaction: Math.min(Math.floor(prev.satisfaction + increments.satisfaction), targets.satisfaction)
        }));
        currentStep++;
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Calculate percentage for progress rings
  const getPercentage = (current, target) => {
    return (current / target) * 100;
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <section className="mc-stats" ref={statsRef}>
      <div className="mc-stats__container">
        {/* Header */}
        <div className="mc-stats__header">
          <span className="mc-stats__badge">Our Impact</span>
          <h2 className="mc-stats__title">
            Growing Stronger 
            <span className="mc-stats__title-highlight"> Every Day</span>
          </h2>
          <p className="mc-stats__subtitle">
            Trusted by thousands of patients and doctors worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mc-stats__grid">
          {/* Patients Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__progress-ring">
              <svg className="mc-stats__ring" width="120" height="120">
                <circle
                  className="mc-stats__ring-bg"
                  stroke="var(--mc-border)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="mc-stats__ring-fill mc-stats__ring-fill--patients"
                  stroke="var(--mc-primary)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - getPercentage(counts.patients, targets.patients) / 100)}`
                  }}
                />
              </svg>
              <span className="mc-stats__ring-icon">👥</span>
            </div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{formatNumber(counts.patients)}+</h3>
              <p className="mc-stats__label">Happy Patients</p>
              <div className="mc-stats__trend mc-stats__trend--positive">
                <span className="mc-stats__trend-icon">↑</span>
                <span className="mc-stats__trend-text">+25% this year</span>
              </div>
            </div>
          </div>

          {/* Doctors Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__progress-ring">
              <svg className="mc-stats__ring" width="120" height="120">
                <circle
                  className="mc-stats__ring-bg"
                  stroke="var(--mc-border)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="mc-stats__ring-fill mc-stats__ring-fill--doctors"
                  stroke="var(--mc-accent)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - getPercentage(counts.doctors, targets.doctors) / 100)}`
                  }}
                />
              </svg>
              <span className="mc-stats__ring-icon">👨‍⚕️</span>
            </div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{formatNumber(counts.doctors)}+</h3>
              <p className="mc-stats__label">Verified Doctors</p>
              <div className="mc-stats__trend mc-stats__trend--positive">
                <span className="mc-stats__trend-icon">↑</span>
                <span className="mc-stats__trend-text">+40 new this month</span>
              </div>
            </div>
          </div>

          {/* Appointments Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__progress-ring">
              <svg className="mc-stats__ring" width="120" height="120">
                <circle
                  className="mc-stats__ring-bg"
                  stroke="var(--mc-border)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="mc-stats__ring-fill mc-stats__ring-fill--appointments"
                  stroke="var(--mc-secondary)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - getPercentage(counts.appointments, targets.appointments) / 100)}`
                  }}
                />
              </svg>
              <span className="mc-stats__ring-icon">📅</span>
            </div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{formatNumber(counts.appointments)}+</h3>
              <p className="mc-stats__label">Appointments</p>
              <div className="mc-stats__trend mc-stats__trend--positive">
                <span className="mc-stats__trend-icon">↑</span>
                <span className="mc-stats__trend-text">+15% vs last month</span>
              </div>
            </div>
          </div>

          {/* Cities Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__large-icon">🏙️</div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{counts.cities}+</h3>
              <p className="mc-stats__label">Cities Covered</p>
              <div className="mc-stats__trend mc-stats__trend--positive">
                <span className="mc-stats__trend-icon">↑</span>
                <span className="mc-stats__trend-text">+12 new cities</span>
              </div>
            </div>
          </div>

          {/* Countries Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__large-icon">🌍</div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{counts.countries}</h3>
              <p className="mc-stats__label">Countries</p>
              <div className="mc-stats__trend">
                <span className="mc-stats__trend-icon">✓</span>
                <span className="mc-stats__trend-text">Global reach</span>
              </div>
            </div>
          </div>

          {/* Satisfaction Stat */}
          <div className="mc-stats__card">
            <div className="mc-stats__progress-ring">
              <svg className="mc-stats__ring" width="120" height="120">
                <circle
                  className="mc-stats__ring-bg"
                  stroke="var(--mc-border)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="mc-stats__ring-fill mc-stats__ring-fill--satisfaction"
                  stroke="var(--mc-primary)"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - counts.satisfaction / 100)}`
                  }}
                />
              </svg>
              <span className="mc-stats__ring-icon">⭐</span>
            </div>
            <div className="mc-stats__content">
              <h3 className="mc-stats__value">{counts.satisfaction}%</h3>
              <p className="mc-stats__label">Satisfaction Rate</p>
              <div className="mc-stats__trend mc-stats__trend--positive">
                <span className="mc-stats__trend-icon">↑</span>
                <span className="mc-stats__trend-text">Highest in industry</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Banner */}
        <div className="mc-stats__achievement">
          <div className="mc-stats__achievement-content">
            <h3 className="mc-stats__achievement-title">Join our growing community</h3>
            <p className="mc-stats__achievement-text">
              Be part of the healthcare revolution. Thousands of patients and doctors 
              have already made the switch to smarter, more convenient healthcare.
            </p>
            <button className="mc-stats__achievement-btn">
              Get Started Today
              <span className="mc-stats__btn-icon">→</span>
            </button>
          </div>
          <div className="mc-stats__achievement-pattern"></div>
        </div>
      </div>
    </section>
  );
};

export default Stats;