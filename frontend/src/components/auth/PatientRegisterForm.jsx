import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth/PatientRegisterForm.css';
import { API_BASE_URL } from '../../config/api';

const PatientRegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'USA',
    city: 'New York',
    locationLine: '',
    password: '',
    date_of_birth: '',
  });
  const countries = ['USA', 'Canada', 'UK', 'India', 'UAE'];
  const citiesByCountry = {
    USA: ['New York', 'Los Angeles', 'Chicago'],
    Canada: ['Toronto', 'Vancouver', 'Montreal'],
    UK: ['London', 'Manchester', 'Birmingham'],
    India: ['Mumbai', 'Delhi', 'Bengaluru'],
    UAE: ['Dubai', 'Abu Dhabi', 'Sharjah']
  };
  const cityOptions = citiesByCountry[formData.country] || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic frontend validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.country || !formData.city || !formData.locationLine) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        location: `${formData.locationLine}, ${formData.city}, ${formData.country}`
      };
      delete payload.country;
      delete payload.city;
      delete payload.locationLine;
      const response = await fetch(`${API_BASE_URL}/api/patients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        throw new Error(data.error || 'Registration failed');
      }

      // Success – store token and route to dashboard
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
      setSuccess('Account created successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard/patient'), 700);
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
        <div className="patient-field">
          <label className="patient-label" htmlFor="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
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
          autoComplete="email"
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
          autoComplete="tel"
          required
          className="patient-input"
        />
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="country">Country *</label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={(event) => {
            const nextCountry = event.target.value;
            const nextCity = citiesByCountry[nextCountry]?.[0] || '';
            setFormData((prev) => ({
              ...prev,
              country: nextCountry,
              city: nextCity
            }));
          }}
          required
          className="patient-input"
        >
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="city">City *</label>
        <select
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="patient-input"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        </div>
        <div className="patient-field">
          <label className="patient-label" htmlFor="locationLine">Location / Address *</label>
        <input
          type="text"
          id="locationLine"
          name="locationLine"
          value={formData.locationLine}
          onChange={handleChange}
          autoComplete="street-address"
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
          autoComplete="new-password"
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
        {success && <div className="patient-success-general">{success}</div>}
        {error && <div className="patient-error-general">{error}</div>}
      </form>
    </div>
  );
};

export default PatientRegisterForm;