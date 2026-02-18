// frontend/src/pages/LoginPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import logoImage from '../assets/MC Logo.png';
import '../styles/LoginPage.css';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-page-container">
        {/* Left Column - Branding */}
        <div className="login-brand">
          <Link to="/" className="login-back-button">← Back to Home</Link>
          <div className="login-brand-content">
            <img src={logoImage} alt="MediConnect" className="login-logo" />
            <h1 className="login-brand-title">Welcome Back</h1>
            <p className="login-brand-subtitle">
              Sign in to access your dashboard, book appointments, and more.
            </p>
            <div className="login-brand-features">
              <div className="brand-feature">✓ Find trusted doctors</div>
              <div className="brand-feature">✓ Secure video consultations</div>
              <div className="brand-feature">✓ Manage medical records</div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="login-form-column">
          <LoginForm />
          <SocialLoginButtons />
          
          {/* Sign up link */}
          <div className="login-signup-prompt">
            <p className="login-signup-text">
              Don't have an account?{' '}
              <Link to="/register" className="login-signup-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;