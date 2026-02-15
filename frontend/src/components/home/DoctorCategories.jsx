// frontend/src/components/home/DoctorCategories.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/home/DoctorCategories.css';

const DoctorCategories = () => {
  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: 'Cardiology', 
      icon: '❤️', 
      doctors: 0,
      description: 'Heart & cardiovascular specialists',
      color: 'primary'
    },
    { 
      id: 2, 
      name: 'Dermatology', 
      icon: '🧴', 
      doctors: 0,
      description: 'Skin, hair & nail care',
      color: 'accent'
    },
    { 
      id: 3, 
      name: 'Pediatrics', 
      icon: '👶', 
      doctors: 0,
      description: 'Child healthcare specialists',
      color: 'secondary'
    },
    { 
      id: 4, 
      name: 'Neurology', 
      icon: '🧠', 
      doctors: 0,
      description: 'Brain & nervous system',
      color: 'primary'
    },
    { 
      id: 5, 
      name: 'Orthopedics', 
      icon: '🦴', 
      doctors: 0,
      description: 'Bones & joint specialists',
      color: 'accent'
    },
    { 
      id: 6, 
      name: 'Ophthalmology', 
      icon: '👁️', 
      doctors: 0,
      description: 'Eye care & vision',
      color: 'secondary'
    },
    { 
      id: 7, 
      name: 'Dentistry', 
      icon: '🦷', 
      doctors: 0,
      description: 'Dental & oral health',
      color: 'primary'
    },
    { 
      id: 8, 
      name: 'Psychiatry', 
      icon: '🧘', 
      doctors: 0,
      description: 'Mental health & wellness',
      color: 'accent'
    },
    { 
      id: 9, 
      name: 'Gynecology', 
      icon: '🌸', 
      doctors: 0,
      description: 'Women\'s health',
      color: 'secondary'
    },
    { 
      id: 10, 
      name: 'Gastroenterology', 
      icon: '🥗', 
      doctors: 0,
      description: 'Digestive system',
      color: 'primary'
    },
    { 
      id: 11, 
      name: 'ENT', 
      icon: '👂', 
      doctors: 0,
      description: 'Ear, nose & throat',
      color: 'accent'
    },
    { 
      id: 12, 
      name: 'Endocrinology', 
      icon: '⚖️', 
      doctors: 0,
      description: 'Hormones & metabolism',
      color: 'secondary'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate loading doctor counts (will be replaced with API call)
  useEffect(() => {
    const targetCounts = [48, 32, 56, 28, 41, 35, 52, 39, 44, 27, 33, 29];
    
    const interval = setInterval(() => {
      setCategories(prev => prev.map((cat, index) => ({
        ...cat,
        doctors: Math.min(cat.doctors + 1, targetCounts[index])
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="mc-categories">
      <div className="mc-categories__container">
        {/* Header */}
        <div className="mc-categories__header">
          <span className="mc-categories__badge">Specialties</span>
          <h2 className="mc-categories__title">
            Find Doctors by 
            <span className="mc-categories__title-highlight"> Specialty</span>
          </h2>
          <p className="mc-categories__subtitle">
            Browse through our extensive network of specialized doctors
          </p>
        </div>

        {/* Search Bar */}
        <div className="mc-categories__search">
          <div className="mc-categories__search-wrapper">
            <span className="mc-categories__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search specialties (e.g., Cardiology, Neurology)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mc-categories__search-input"
            />
            {searchTerm && (
              <button 
                className="mc-categories__search-clear"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mc-categories__grid">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`mc-categories__card mc-categories__card--${category.color} ${activeCategory === category.id ? 'mc-categories__card--active' : ''}`}
              onMouseEnter={() => setActiveCategory(category.id)}
              onMouseLeave={() => setActiveCategory(null)}
              onClick={() => console.log(`Navigate to ${category.name} doctors`)}
            >
              {/* Icon */}
              <div className="mc-categories__card-icon-wrapper">
                <span className="mc-categories__card-icon">{category.icon}</span>
              </div>

              {/* Content */}
              <div className="mc-categories__card-content">
                <h3 className="mc-categories__card-name">{category.name}</h3>
                <p className="mc-categories__card-description">{category.description}</p>
                
                {/* Doctor Count */}
                <div className="mc-categories__card-doctors">
                  <span className="mc-categories__doctors-icon">👨‍⚕️</span>
                  <span className="mc-categories__doctors-count">{category.doctors}+</span>
                  <span className="mc-categories__doctors-label">Specialists</span>
                </div>

                {/* Explore Link */}
                <div className="mc-categories__card-link">
                  <span>Explore {category.name}</span>
                  <span className="mc-categories__link-arrow">→</span>
                </div>
              </div>

              {/* Background Pattern */}
              <div className="mc-categories__card-pattern"></div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {filteredCategories.length > 0 && (
          <div className="mc-categories__footer">
            <a href="/doctors" className="mc-categories__view-all">
              View All Specialties
              <span className="mc-categories__link-icon">→</span>
            </a>
            <p className="mc-categories__total-doctors">
              <span className="mc-categories__total-number">500+</span> doctors across all specialties
            </p>
          </div>
        )}

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="mc-categories__no-results">
            <div className="mc-categories__no-results-icon">🔍</div>
            <h3 className="mc-categories__no-results-title">No specialties found</h3>
            <p className="mc-categories__no-results-text">
              Try searching with different keywords
            </p>
            <button 
              className="mc-categories__no-results-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DoctorCategories;