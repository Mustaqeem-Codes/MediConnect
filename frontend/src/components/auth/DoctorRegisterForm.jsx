// frontend/src/components/auth/DoctorRegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth/DoctorRegisterForm.css';
import { API_BASE_URL } from '../../config/api';

const DoctorRegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'USA',
    city: 'New York',
    locationLine: '',
    licenseNumber: '',
    specialty: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.locationLine.trim()) newErrors.locationLine = 'Location is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    if (!formData.specialty) newErrors.specialty = 'Specialty is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);

    try {
      const locationValue = `${formData.locationLine}, ${formData.city}, ${formData.country}`;
      const response = await fetch(`${API_BASE_URL}/api/doctors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          location: locationValue,
          license_number: formData.licenseNumber,
          specialty: formData.specialty
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
      setSuccess('Account created successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard/doctor'), 700);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const specialties = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Neurology',
    'Orthopedics', 'Gynecology', 'Dentistry', 'Ophthalmology',
    'Psychiatry', 'General Practice'
  ];

  const countries = ['USA', 'Canada', 'UK', 'India', 'UAE'];
  const citiesByCountry = {
    USA: ['New York', 'Los Angeles', 'Chicago'],
    Canada: ['Toronto', 'Vancouver', 'Montreal'],
    UK: ['London', 'Manchester', 'Birmingham'],
    India: ['Mumbai', 'Delhi', 'Bengaluru'],
    UAE: ['Dubai', 'Abu Dhabi', 'Sharjah']
  };

  const cityOptions = citiesByCountry[formData.country] || [];

  return (
    <div className="doctor-form-container">
      <form onSubmit={handleSubmit} className="doctor-form">
        <h2 className="doctor-form-title">Create Doctor Account</h2>
        <div className="doctor-field">
          <label className="doctor-label">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="name" className={`doctor-input ${errors.name ? 'error' : ''}`} placeholder="Dr. John Doe" />
          {errors.name && <span className="doctor-error">{errors.name}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" className={`doctor-input ${errors.email ? 'error' : ''}`} placeholder="doctor@example.com" />
          {errors.email && <span className="doctor-error">{errors.email}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" className={`doctor-input ${errors.phone ? 'error' : ''}`} placeholder="+1 234 567 890" />
          {errors.phone && <span className="doctor-error">{errors.phone}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Country</label>
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
              if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
            }}
            className={`doctor-select ${errors.country ? 'error' : ''}`}
            required
          >
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {errors.country && <span className="doctor-error">{errors.country}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">City</label>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`doctor-select ${errors.city ? 'error' : ''}`}
            required
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && <span className="doctor-error">{errors.city}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Clinic Location</label>
          <input type="text" name="locationLine" value={formData.locationLine} onChange={handleChange} autoComplete="street-address" className={`doctor-input ${errors.locationLine ? 'error' : ''}`} placeholder="Street address or area" />
          {errors.locationLine && <span className="doctor-error">{errors.locationLine}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Medical License Number</label>
          <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} autoComplete="off" className={`doctor-input ${errors.licenseNumber ? 'error' : ''}`} placeholder="License #" />
          {errors.licenseNumber && <span className="doctor-error">{errors.licenseNumber}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Specialty</label>
          <select name="specialty" value={formData.specialty} onChange={handleChange} className={`doctor-select ${errors.specialty ? 'error' : ''}`}>
            <option value="">Select Specialty</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.specialty && <span className="doctor-error">{errors.specialty}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" className={`doctor-input ${errors.password ? 'error' : ''}`} placeholder="••••••••" />
          {errors.password && <span className="doctor-error">{errors.password}</span>}
        </div>

        <div className="doctor-field">
          <label className="doctor-label">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" className={`doctor-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="••••••••" />
          {errors.confirmPassword && <span className="doctor-error">{errors.confirmPassword}</span>}
        </div>

        <div className="doctor-field doctor-terms">
          <label className="doctor-checkbox">
            <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} />
            <span>I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a></span>
          </label>
          {errors.agreeTerms && <span className="doctor-error">{errors.agreeTerms}</span>}
        </div>

        <button type="submit" className="doctor-submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Sign Up as Doctor'}
        </button>
        {success && <div className="doctor-success-general">{success}</div>}
        {errors.general && <div className="doctor-error-general">{errors.general}</div>}
      </form>
    </div>
  );
};

export default DoctorRegisterForm;