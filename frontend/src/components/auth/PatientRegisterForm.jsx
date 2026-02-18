import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth/PatientRegisterForm.css';

const PatientRegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '',
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

    // Basic frontend validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        throw new Error(data.error || 'Registration failed');
      }

      // Success – store token and route to dashboard
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
      navigate('/dashboard/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-form-container">
      <form onSubmit={handleSubmit}>
        <h2 className="patient-form-title">Create Patient Account</h2>
        {error && <div className="patient-error-general">{error}</div>}
        <div className="patient-field">
          <label className="patient-label" htmlFor="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="patient-input"
        />
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="patient-input"
        />
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="phone">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="patient-input"
        />
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
          className="patient-input"
        />
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="date_of_birth">Date of Birth (optional)</label>
        <input
          type="date"
          id="date_of_birth"
          name="date_of_birth"
          value={formData.date_of_birth}
          onChange={handleChange}
          className="patient-input"
        />
        </div>
        <button type="submit" className="patient-submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default PatientRegisterForm;