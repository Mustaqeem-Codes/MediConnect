import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/auth/LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show success message from registration if present
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure at least one of email/phone is provided
    if (!formData.email && !formData.phone) {
      setError('Please provide either email or phone.');
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      setLoading(false);
      return;
    }

    // Prepare payload: send only provided identifier
    const payload = {
      password: formData.password,
    };
    if (formData.email) payload.email = formData.email;
    if (formData.phone) payload.phone = formData.phone;

    try {
      const endpoint = role === 'doctor' ? 'http://localhost:5000/api/doctors/login' : 'http://localhost:5000/api/patients/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data)); // includes id, name, email, etc.

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }

      // Redirect to role dashboard
      navigate(role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to continue</p>
        <div className="login-role-switch">
          <button
            type="button"
            className={`login-role-btn ${role === 'patient' ? 'active' : ''}`}
            onClick={() => setRole('patient')}
          >
            Patient
          </button>
          <button
            type="button"
            className={`login-role-btn ${role === 'doctor' ? 'active' : ''}`}
            onClick={() => setRole('doctor')}
          >
            Doctor
          </button>
        </div>
        {successMessage && <div className="login-success">{successMessage}</div>}
        {error && <div className="login-error-general">{error}</div>}
        <div className="login-field">
          <label className="login-label" htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="login-input"
        />
        </div>
        <div className="login-field">
          <label className="login-label" htmlFor="phone">Phone (optional if email provided)</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone"
          className="login-input"
        />
        </div>
        <div className="login-field">
          <label className="login-label" htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="login-input"
        />
        </div>
        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="login-signup">
          Don't have an account? <a href="/register">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;