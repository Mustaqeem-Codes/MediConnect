// frontend/src/components/home/HowItWorks.jsx
import React, { useState } from 'react';
import '../../styles/home/HowItWorks.css';

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('patient');

  const patientSteps = [
    {
      step: 1,
      title: 'Create Account',
      description: 'Sign up in minutes with your email or social media accounts',
      icon: '📝',
      details: 'Basic info, verify email, set preferences'
    },
    {
      step: 2,
      title: 'Find a Doctor',
      description: 'Search by specialty, location, ratings, or insurance acceptance',
      icon: '🔍',
      details: 'Filter by experience, availability, languages'
    },
    {
      step: 3,
      title: 'Book Appointment',
      description: 'Choose a convenient time and pay securely online',
      icon: '📅',
      details: 'Real-time availability, instant confirmation'
    },
    {
      step: 4,
      title: 'Get Care',
      description: 'Visit in-person or connect via video consultation',
      icon: '👨‍⚕️',
      details: 'Receive prescriptions, upload reports, follow-up'
    }
  ];

  const doctorSteps = [
    {
      step: 1,
      title: 'Complete Profile',
      description: 'Add your credentials, specialties, and clinic information',
      icon: '📋',
      details: 'Upload license, set consultation fees'
    },
    {
      step: 2,
      title: 'Get Verified',
      description: 'Our team verifies your credentials within 24-48 hours',
      icon: '✓',
      details: 'Background check, license verification'
    },
    {
      step: 3,
      title: 'Set Schedule',
      description: 'Define your availability and consultation types',
      icon: '⏰',
      details: 'Set recurring slots, block time off'
    },
    {
      step: 4,
      title: 'Start Practicing',
      description: 'Accept appointments and grow your practice',
      icon: '🚀',
      details: 'Manage patients, track earnings'
    }
  ];

  const steps = activeTab === 'patient' ? patientSteps : doctorSteps;

  return (
    <section className="mc-how-it-works">
      <div className="mc-how-it-works__container">
        {/* Header */}
        <div className="mc-how-it-works__header">
          <span className="mc-how-it-works__badge">Simple Process</span>
          <h2 className="mc-how-it-works__title">
            How It 
            <span className="mc-how-it-works__title-highlight"> Works</span>
          </h2>
          <p className="mc-how-it-works__subtitle">
            Get started in minutes - whether you're seeking care or providing it
          </p>
        </div>

        {/* Tabs */}
        <div className="mc-how-it-works__tabs">
          <button
            className={`mc-how-it-works__tab ${activeTab === 'patient' ? 'mc-how-it-works__tab--active' : ''}`}
            onClick={() => setActiveTab('patient')}
          >
            <span className="mc-how-it-works__tab-icon">👤</span>
            <span className="mc-how-it-works__tab-text">For Patients</span>
          </button>
          <button
            className={`mc-how-it-works__tab ${activeTab === 'doctor' ? 'mc-how-it-works__tab--active' : ''}`}
            onClick={() => setActiveTab('doctor')}
          >
            <span className="mc-how-it-works__tab-icon">👨‍⚕️</span>
            <span className="mc-how-it-works__tab-text">For Doctors</span>
          </button>
          <div className="mc-how-it-works__tab-highlight"></div>
        </div>

        {/* Steps Grid */}
        <div className="mc-how-it-works__steps-grid">
          {steps.map((step, index) => (
            <div key={step.step} className="mc-how-it-works__step-card">
              {/* Step Number */}
              <div className="mc-how-it-works__step-number-wrapper">
                <div className="mc-how-it-works__step-number">{step.step}</div>
                <div className="mc-how-it-works__step-connector"></div>
              </div>

              {/* Step Content */}
              <div className="mc-how-it-works__step-content">
                <div className="mc-how-it-works__step-icon-wrapper">
                  <span className="mc-how-it-works__step-icon">{step.icon}</span>
                </div>
                <h3 className="mc-how-it-works__step-title">{step.title}</h3>
                <p className="mc-how-it-works__step-description">{step.description}</p>
                <div className="mc-how-it-works__step-details">
                  <span className="mc-how-it-works__details-icon">✓</span>
                  <span className="mc-how-it-works__details-text">{step.details}</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="mc-how-it-works__step-hover-effect"></div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mc-how-it-works__cta">
          <div className="mc-how-it-works__cta-content">
            <h3 className="mc-how-it-works__cta-title">Ready to get started?</h3>
            <p className="mc-how-it-works__cta-description">
              Join thousands of satisfied patients and doctors on our platform
            </p>
            <div className="mc-how-it-works__cta-buttons">
              <a href="/register/patient" className="mc-how-it-works__cta-btn mc-how-it-works__cta-btn--primary">
                Register as Patient
                <span className="mc-how-it-works__btn-icon">→</span>
              </a>
              <a href="/register/doctor" className="mc-how-it-works__cta-btn mc-how-it-works__cta-btn--outline">
                Join as Doctor
                <span className="mc-how-it-works__btn-icon">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;