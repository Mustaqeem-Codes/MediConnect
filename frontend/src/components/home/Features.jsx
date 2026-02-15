// frontend/src/components/home/Features.jsx
import React from 'react';
import '../../styles/home/Features.css';

const Features = () => {
  const patientFeatures = [
    {
      icon: '🔍',
      title: 'Find Specialists',
      description: 'Search by specialty, location, experience, and patient reviews',
      color: 'primary'
    },
    {
      icon: '📅',
      title: 'Instant Booking',
      description: 'Book appointments 24/7 with real-time availability',
      color: 'accent'
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Pay online securely with multiple payment options',
      color: 'primary'
    },
    {
      icon: '📁',
      title: 'Medical Records',
      description: 'Access your health records, prescriptions, and reports anytime',
      color: 'secondary'
    },
    {
      icon: '💬',
      title: 'Chat with Doctors',
      description: 'Quick consultations and follow-ups via secure messaging',
      color: 'accent'
    },
    {
      icon: '⭐',
      title: 'Rate & Review',
      description: 'Help others by sharing your experience with doctors',
      color: 'secondary'
    }
  ];

  const doctorFeatures = [
    {
      icon: '📋',
      title: 'Smart Scheduling',
      description: 'Manage your calendar, set availability, and reduce no-shows',
      color: 'primary'
    },
    {
      icon: '💰',
      title: 'Easy Payouts',
      description: 'Get paid directly to your bank account with transparent fees',
      color: 'accent'
    },
    {
      icon: '📊',
      title: 'Patient Analytics',
      description: 'Track your practice growth and patient demographics',
      color: 'secondary'
    },
    {
      icon: '📝',
      title: 'Digital Prescriptions',
      description: 'Send e-prescriptions directly to pharmacies',
      color: 'primary'
    },
    {
      icon: '📹',
      title: 'Video Consultations',
      description: 'Conduct secure video calls with integrated tools',
      color: 'accent'
    },
    {
      icon: '⭐',
      title: 'Reputation Management',
      description: 'Respond to reviews and build your online presence',
      color: 'secondary'
    }
  ];

  return (
    <section className="mc-features">
      <div className="mc-features__container">
        {/* Section Header */}
        <div className="mc-features__header">
          <span className="mc-features__badge">Why Choose Us</span>
          <h2 className="mc-features__title">
            Comprehensive Healthcare 
            <span className="mc-features__title-highlight"> Platform</span>
          </h2>
          <p className="mc-features__subtitle">
            Everything you need in one place - whether you're seeking care or providing it
          </p>
        </div>

        {/* Features Grid */}
        <div className="mc-features__showcase">
          {/* For Patients Section */}
          <div className="mc-features__group">
            <div className="mc-features__group-header">
              <h3 className="mc-features__group-title">
                <span className="mc-features__group-icon">👤</span>
                For Patients
              </h3>
              <p className="mc-features__group-description">
                Your health journey made simple and accessible
              </p>
            </div>
            
            <div className="mc-features__grid">
              {patientFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className={`mc-features__card mc-features__card--${feature.color}`}
                >
                  <div className="mc-features__card-icon-wrapper">
                    <span className="mc-features__card-icon">{feature.icon}</span>
                  </div>
                  <h4 className="mc-features__card-title">{feature.title}</h4>
                  <p className="mc-features__card-description">{feature.description}</p>
                  <div className="mc-features__card-hover-effect"></div>
                </div>
              ))}
            </div>
          </div>

          {/* For Doctors Section */}
          <div className="mc-features__group">
            <div className="mc-features__group-header">
              <h3 className="mc-features__group-title">
                <span className="mc-features__group-icon">👨‍⚕️</span>
                For Doctors
              </h3>
              <p className="mc-features__group-description">
                Grow your practice with powerful tools
              </p>
            </div>
            
            <div className="mc-features__grid">
              {doctorFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className={`mc-features__card mc-features__card--${feature.color}`}
                >
                  <div className="mc-features__card-icon-wrapper">
                    <span className="mc-features__card-icon">{feature.icon}</span>
                  </div>
                  <h4 className="mc-features__card-title">{feature.title}</h4>
                  <p className="mc-features__card-description">{feature.description}</p>
                  <div className="mc-features__card-hover-effect"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mc-features__stats">
          <div className="mc-features__stat-card">
            <div className="mc-features__stat-value">50,000+</div>
            <div className="mc-features__stat-label">Active Patients</div>
          </div>
          <div className="mc-features__stat-card">
            <div className="mc-features__stat-value">500+</div>
            <div className="mc-features__stat-label">Verified Doctors</div>
          </div>
          <div className="mc-features__stat-card">
            <div className="mc-features__stat-value">100,000+</div>
            <div className="mc-features__stat-label">Appointments</div>
          </div>
          <div className="mc-features__stat-card">
            <div className="mc-features__stat-value">4.9</div>
            <div className="mc-features__stat-label">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;