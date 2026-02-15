// frontend/src/components/home/Testimonials.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/home/Testimonials.css';

const Testimonials = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const patientTestimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 34,
      location: 'New York, NY',
      avatar: 'SJ',
      rating: 5,
      title: 'Life-changing experience',
      content: 'Found an amazing cardiologist through MediConnect. The booking process was seamless, and the video consultation saved me hours of travel time. My doctor was incredibly thorough and caring.',
      date: '2 weeks ago',
      condition: 'Heart Health',
      doctor: 'Dr. James Wilson',
      verified: true,
      helpful: 124
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 45,
      location: 'San Francisco, CA',
      avatar: 'MC',
      rating: 5,
      title: 'Finally found the right specialist',
      content: 'After months of searching for a good dermatologist, MediConnect helped me find Dr. Patel. The online booking, insurance verification, and prescription delivery were all handled perfectly.',
      date: '1 month ago',
      condition: 'Skin Condition',
      doctor: 'Dr. Priya Patel',
      verified: true,
      helpful: 89
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      age: 28,
      location: 'Miami, FL',
      avatar: 'ER',
      rating: 4,
      title: 'Convenient and professional',
      content: 'As a working mom, finding time for doctor visits was impossible. MediConnect lets me book evening appointments and even do follow-ups via chat. Highly recommended!',
      date: '3 weeks ago',
      condition: 'General Checkup',
      doctor: 'Dr. Robert Martinez',
      verified: true,
      helpful: 67
    },
    {
      id: 4,
      name: 'David Kim',
      age: 52,
      location: 'Seattle, WA',
      avatar: 'DK',
      rating: 5,
      title: 'Excellent platform for healthcare',
      content: 'The ability to read detailed doctor profiles and verified patient reviews helped me choose the right orthopedic surgeon. My knee replacement went smoothly thanks to Dr. Thompson.',
      date: '2 months ago',
      condition: 'Orthopedic',
      doctor: 'Dr. Sarah Thompson',
      verified: true,
      helpful: 156
    }
  ];

  const doctorTestimonials = [
    {
      id: 1,
      name: 'Dr. James Wilson',
      specialty: 'Cardiologist',
      location: 'New York, NY',
      avatar: 'JW',
      rating: 5,
      title: 'Growing my practice efficiently',
      content: 'MediConnect has transformed how I manage my practice. The scheduling system reduced no-shows by 60%, and the payment processing is seamless. I can focus on what matters most - my patients.',
      date: 'Joined 8 months ago',
      patients: 450,
      verified: true,
      helpful: 234
    },
    {
      id: 2,
      name: 'Dr. Priya Patel',
      specialty: 'Dermatologist',
      location: 'San Francisco, CA',
      avatar: 'PP',
      rating: 5,
      title: 'The best decision for my practice',
      content: 'The platform handles everything from appointment booking to insurance verification. My administrative workload has decreased significantly, and my patients love the convenience.',
      date: 'Joined 1 year ago',
      patients: 620,
      verified: true,
      helpful: 189
    },
    {
      id: 3,
      name: 'Dr. Robert Martinez',
      specialty: 'Pediatrician',
      location: 'Miami, FL',
      avatar: 'RM',
      rating: 4,
      title: 'Great for building patient relationships',
      content: 'The follow-up features and chat functionality help me stay connected with parents. The platform is intuitive and my young patients love the easy-to-use interface.',
      date: 'Joined 6 months ago',
      patients: 280,
      verified: true,
      helpful: 112
    },
    {
      id: 4,
      name: 'Dr. Sarah Thompson',
      specialty: 'Orthopedic Surgeon',
      location: 'Seattle, WA',
      avatar: 'ST',
      rating: 5,
      title: 'Professional and reliable',
      content: 'From credential verification to payment disbursement, everything is handled professionally. The platform has helped me reach patients I wouldn\'t have found otherwise.',
      date: 'Joined 1 year ago',
      patients: 580,
      verified: true,
      helpful: 267
    }
  ];

  const testimonials = activeTab === 'patients' ? patientTestimonials : doctorTestimonials;

  // Auto-play carousel
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  // Reset slide when tab changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeTab]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`mc-testimonials__star ${index < rating ? 'mc-testimonials__star--filled' : ''}`}>
        {index < rating ? '★' : '☆'}
      </span>
    ));
  };

  return (
    <section className="mc-testimonials">
      <div className="mc-testimonials__container">
        {/* Header */}
        <div className="mc-testimonials__header">
          <span className="mc-testimonials__badge">Testimonials</span>
          <h2 className="mc-testimonials__title">
            What Our 
            <span className="mc-testimonials__title-highlight"> Community Says</span>
          </h2>
          <p className="mc-testimonials__subtitle">
            Real stories from patients and doctors who trust MediConnect
          </p>
        </div>

        {/* Tabs */}
        <div className="mc-testimonials__tabs">
          <button
            className={`mc-testimonials__tab ${activeTab === 'patients' ? 'mc-testimonials__tab--active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <span className="mc-testimonials__tab-icon">👤</span>
            <span className="mc-testimonials__tab-text">Patient Stories</span>
            <span className="mc-testimonials__tab-count">{patientTestimonials.length}</span>
          </button>
          <button
            className={`mc-testimonials__tab ${activeTab === 'doctors' ? 'mc-testimonials__tab--active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <span className="mc-testimonials__tab-icon">👨‍⚕️</span>
            <span className="mc-testimonials__tab-text">Doctor Reviews</span>
            <span className="mc-testimonials__tab-count">{doctorTestimonials.length}</span>
          </button>
        </div>

        {/* Testimonials Carousel */}
        <div className="mc-testimonials__carousel">
          {/* Main Slide */}
          <div className="mc-testimonials__carousel-container">
            <button className="mc-testimonials__nav mc-testimonials__nav--prev" onClick={prevSlide}>
              ←
            </button>

            <div className="mc-testimonials__track">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`mc-testimonials__card ${index === currentSlide ? 'mc-testimonials__card--active' : ''}`}
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Rating */}
                  <div className="mc-testimonials__rating">
                    <div className="mc-testimonials__stars">{renderStars(testimonial.rating)}</div>
                    <span className="mc-testimonials__rating-score">{testimonial.rating}.0</span>
                  </div>

                  {/* Content */}
                  <h3 className="mc-testimonials__card-title">{testimonial.title}</h3>
                  <p className="mc-testimonials__card-content">"{testimonial.content}"</p>

                  {/* Author Info */}
                  <div className="mc-testimonials__author">
                    <div className="mc-testimonials__author-avatar">
                      {testimonial.avatar}
                    </div>
                    <div className="mc-testimonials__author-info">
                      <h4 className="mc-testimonials__author-name">
                        {testimonial.name}
                        {testimonial.verified && (
                          <span className="mc-testimonials__verified-badge" title="Verified User">✓</span>
                        )}
                      </h4>
                      <p className="mc-testimonials__author-details">
                        {activeTab === 'patients' ? (
                          <>
                            {testimonial.age} years • {testimonial.location}
                          </>
                        ) : (
                          <>
                            {testimonial.specialty} • {testimonial.location}
                          </>
                        )}
                      </p>
                      {activeTab === 'patients' && (
                        <p className="mc-testimonials__appointment-details">
                          Consulted Dr. {testimonial.doctor} for {testimonial.condition}
                        </p>
                      )}
                      {activeTab === 'doctors' && (
                        <p className="mc-testimonials__practice-stats">
                          <span className="mc-testimonials__stat-badge">
                            👥 {testimonial.patients}+ patients
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mc-testimonials__footer">
                    <span className="mc-testimonials__date">{testimonial.date}</span>
                    <button className="mc-testimonials__helpful-btn">
                      <span className="mc-testimonials__helpful-icon">👍</span>
                      Helpful ({testimonial.helpful})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mc-testimonials__nav mc-testimonials__nav--next" onClick={nextSlide}>
              →
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="mc-testimonials__dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`mc-testimonials__dot ${index === currentSlide ? 'mc-testimonials__dot--active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mc-testimonials__trust-signals">
          <div className="mc-testimonials__trust-signal">
            <span className="mc-testimonials__signal-icon">✓</span>
            <div className="mc-testimonials__signal-content">
              <h4>Verified Reviews</h4>
              <p>All testimonials from verified users</p>
            </div>
          </div>
          <div className="mc-testimonials__trust-signal">
            <span className="mc-testimonials__signal-icon">🔒</span>
            <div className="mc-testimonials__signal-content">
              <h4>Real Experiences</h4>
              <p>Authentic stories from real patients</p>
            </div>
          </div>
          <div className="mc-testimonials__trust-signal">
            <span className="mc-testimonials__signal-icon">⭐</span>
            <div className="mc-testimonials__signal-content">
              <h4>4.9 Average Rating</h4>
              <p>From 10,000+ reviews</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;