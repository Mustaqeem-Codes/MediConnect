import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import '../styles/PatientProfilePage.css';
import { API_BASE_URL } from '../config/api';

const PatientProfilePage = () => {
  const navigate = useNavigate();
  const countries = ['USA', 'Canada', 'UK', 'India', 'UAE'];
  const citiesByCountry = {
    USA: ['New York', 'Los Angeles', 'Chicago'],
    Canada: ['Toronto', 'Vancouver', 'Montreal'],
    UK: ['London', 'Manchester', 'Birmingham'],
    India: ['Mumbai', 'Delhi', 'Bengaluru'],
    UAE: ['Dubai', 'Abu Dhabi', 'Sharjah']
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    country: 'USA',
    city: 'New York',
    locationLine: ''
  });
  const cityOptions = citiesByCountry[formData.country] || [];

  const parseLocation = (value) => {
    if (!value) {
      return {
        locationLine: '',
        city: citiesByCountry.USA?.[0] || 'New York',
        country: 'USA'
      };
    }
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const country = parts[parts.length - 1];
      const city = parts[parts.length - 2];
      const locationLine = parts.slice(0, -2).join(', ');
      return { country, city, locationLine };
    }
    return {
      locationLine: value,
      city: citiesByCountry.USA?.[0] || 'New York',
      country: 'USA'
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          date_of_birth: data.data.date_of_birth
            ? String(data.data.date_of_birth).slice(0, 10)
            : '',
          ...parseLocation(data.data.location)
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=patient');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          location: `${formData.locationLine}, ${formData.city}, ${formData.country}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mc-patient-profile">
      <PatientSidebar />
      <main className="mc-patient-profile__content">
        <header className="mc-patient-profile__header">
          <h1>Profile & Settings</h1>
          <p>Keep your contact details up to date for your care team.</p>
        </header>

        {loading && <div className="mc-patient-profile__state">Loading profile...</div>}
        {error && <div className="mc-patient-profile__error">{error}</div>}
        {success && <div className="mc-patient-profile__success">{success}</div>}

        {!loading && (
          <form className="mc-patient-profile__form" onSubmit={handleSubmit}>
            <label className="mc-patient-profile__field">
              <span>Full Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="mc-patient-profile__field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </label>

            <label className="mc-patient-profile__field">
              <span>Date of Birth</span>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </label>

            <label className="mc-patient-profile__field">
              <span>Location / Address</span>
              <select
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
              >
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </label>

            <label className="mc-patient-profile__field">
              <span>City</span>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              >
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <label className="mc-patient-profile__field">
              <span>Location / Address</span>
              <input
                type="text"
                name="locationLine"
                value={formData.locationLine}
                onChange={handleChange}
                required
              />
            </label>

            <button type="submit" className="mc-patient-profile__submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default PatientProfilePage;
