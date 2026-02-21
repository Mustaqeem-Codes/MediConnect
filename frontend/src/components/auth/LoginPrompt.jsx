// frontend/src/components/auth/LoginPrompt.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/auth/LoginPrompt.css';

const LoginPrompt = ({ role = 'patient' }) => {
  return (
    <div className="login-prompt">
      <p className="login-prompt-text">
        Already have an account?{' '}
        <Link to={`/login?role=${role}`} className="login-prompt-link">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default LoginPrompt;