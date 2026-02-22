import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth/LoginForm.css';
import { API_BASE_URL } from '../../config/api';

const AdminLoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email) {
      setError('Admin login requires email.');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data));

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }

      navigate('/dashboard/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit}>
        <h2 className="login-title">Admin Login</h2>
        <p className="login-subtitle">Authorized personnel only</p>

        <div className="login-field">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="Enter admin email"
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
            autoComplete="current-password"
            required
            className="login-input"
          />
        </div>

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && <div className="login-error-general">{error}</div>}
      </form>
    </div>
  );
};

export default AdminLoginForm;
