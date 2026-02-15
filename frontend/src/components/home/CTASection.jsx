// frontend/src/components/home/CTASection.jsx
import React from 'react';
import '../../styles/home/CTASection.css';

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        {/* Left Content */}
        <div className="cta-content-wrapper">
          <span className="cta-badge">Ready to Start?</span>
          <h2 className="cta-heading">
            Your Health Journey 
            <span className="cta-heading-highlight"> Starts Here</span>
          </h2>
          <p className="cta-description">
            Join thousands of satisfied patients and doctors who have already 
            transformed their healthcare experience with MediConnect.
          </p>

          {/* Features List */}
          <div className="cta-features-grid">
            <div className="cta-feature-item">
              <span className="cta-feature-icon">✓</span>
              <span className="cta-feature-text">Free registration</span>
            </div>
            <div className="cta-feature-item">
              <span className="cta-feature-icon">✓</span>
              <span className="cta-feature-text">Verified doctors</span>
            </div>
            <div className="cta-feature-item">
              <span className="cta-feature-icon">✓</span>
              <span className="cta-feature-text">Secure payments</span>
            </div>
            <div className="cta-feature-item">
              <span className="cta-feature-icon">✓</span>
              <span className="cta-feature-text">24/7 support</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="cta-buttons-wrapper">
            <a href="/register/patient" className="cta-button cta-button-primary">
              <span className="cta-button-text">Register as Patient</span>
              <span className="cta-button-icon">→</span>
            </a>
            <a href="/register/doctor" className="cta-button cta-button-secondary">
              <span className="cta-button-text">Join as Doctor</span>
              <span className="cta-button-icon">→</span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="cta-trust-badges">
            <div className="cta-trust-badge">
              <span className="cta-trust-icon">🔒</span>
              <div className="cta-trust-info">
                <span className="cta-trust-title">HIPAA Compliant</span>
                <span className="cta-trust-subtitle">Your data is safe</span>
              </div>
            </div>
            <div className="cta-trust-badge">
              <span className="cta-trust-icon">⭐</span>
              <div className="cta-trust-info">
                <span className="cta-trust-title">4.9/5 Rating</span>
                <span className="cta-trust-subtitle">From 10k+ reviews</span>
              </div>
            </div>
            <div className="cta-trust-badge">
              <span className="cta-trust-icon">🕒</span>
              <div className="cta-trust-info">
                <span className="cta-trust-title">Instant Access</span>
                <span className="cta-trust-subtitle">No waiting lists</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Stats Cards */}
        <div className="cta-stats-wrapper">
          <div className="cta-stats-card cta-stats-card-primary">
            <div className="cta-stats-header">
              <span className="cta-stats-icon">👥</span>
              <span className="cta-stats-number">50k+</span>
            </div>
            <p className="cta-stats-label">Active Patients</p>
          </div>

          <div className="cta-stats-card cta-stats-card-accent">
            <div className="cta-stats-header">
              <span className="cta-stats-icon">👨‍⚕️</span>
              <span className="cta-stats-number">500+</span>
            </div>
            <p className="cta-stats-label">Verified Doctors</p>
          </div>

          <div className="cta-stats-card cta-stats-card-secondary">
            <div className="cta-stats-header">
              <span className="cta-stats-icon">📅</span>
              <span className="cta-stats-number">100k+</span>
            </div>
            <p className="cta-stats-label">Appointments</p>
          </div>

          <div className="cta-stats-card cta-stats-card-gradient">
            <div className="cta-stats-quote">
              <span className="cta-quote-mark">"</span>
              <p className="cta-quote-text">
                Found my cardiologist in minutes. Best decision ever!
              </p>
              <div className="cta-quote-author">
                <span className="cta-author-name">Sarah Johnson</span>
                <span className="cta-author-rating">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="cta-background-pattern"></div>
      <div className="cta-background-dots"></div>
    </section>
  );
};

export default CTASection;