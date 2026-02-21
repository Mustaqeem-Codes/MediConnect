// frontend/src/pages/RegisterPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PatientRegisterForm from '../components/auth/PatientRegisterForm';
import DoctorRegisterForm from '../components/auth/DoctorRegisterForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import LoginPrompt from '../components/auth/LoginPrompt';
import logoImage from '../assets/MC Logo.png';
import '../styles/RegisterPage.css';

const RegisterPage = () => {
  const location = useLocation();
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'patient' || roleParam === 'doctor') {
      setRole(roleParam);
    }
  }, [location.search]);

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Promo Area - changes with role */}
        <div className={`register-promo promo-${role}`}>
          <Link to="/" className="promo-back-button">← Back to Home</Link>
          <div className="promo-content">
            <img src={logoImage} alt="MediConnect" className="promo-logo" />
            <h1 className="promo-title">
              {role === 'patient' ? 'Join as Patient' : 'Join as Doctor'}
            </h1>
            <p className="promo-description">
              {role === 'patient'
                ? 'Access trusted healthcare providers, book appointments, and manage your health records securely.'
                : 'Expand your practice, connect with patients, and manage your schedule efficiently.'}
            </p>
            <div className="promo-features">
              {role === 'patient' ? (
                <>
                  <div className="promo-feature">✓ Find top specialists</div>
                  <div className="promo-feature">✓ Instant appointment booking</div>
                  <div className="promo-feature">✓ Secure medical records</div>
                </>
              ) : (
                <>
                  <div className="promo-feature">✓ Grow your patient base</div>
                  <div className="promo-feature">✓ Easy schedule management</div>
                  <div className="promo-feature">✓ Timely payments</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="register-form-area">
          {/* Role Selector */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => handleRoleChange('patient')}
            >
              👤 Patient
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => handleRoleChange('doctor')}
            >
              👨‍⚕️ Doctor
            </button>
          </div>

          {/* Dynamic Form */}
          {role === 'patient' ? (
            <PatientRegisterForm />
          ) : (
            <DoctorRegisterForm />
          )}

          <SocialLoginButtons />
          <LoginPrompt role={role} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;