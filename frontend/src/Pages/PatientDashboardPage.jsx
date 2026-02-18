import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import AppointmentsList from '../components/dashboard/AppointmentsList';
import '../styles/PatientDashboardPage.css';

const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const response = await fetch('http://localhost:5000/api/patients/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setProfile(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/dashboard/patient/profile');
  };

  return (
    <div className="mc-dashboard-layout">
      <PatientSidebar />
      <div className="mc-dashboard">
        <header className="mc-dashboard__header">
          <div>
            <p className="mc-dashboard__eyebrow">Patient Dashboard</p>
            <h1 className="mc-dashboard__title">
              {profile ? `Welcome, ${profile.name}!` : 'Welcome'}
            </h1>
            <p className="mc-dashboard__subtitle">Here is a quick overview of your care.</p>
          </div>
          <button onClick={handleLogout} className="mc-dashboard__logout">Logout</button>
        </header>

        {loading && <div className="mc-dashboard__state">Loading your profile...</div>}
        {error && <div className="mc-dashboard__error">{error}</div>}

        {!loading && !error && (
          <div className="mc-dashboard__grid">
            <AppointmentsList
              items={[
                {
                  id: 1,
                  doctor: 'Dr. Smith',
                  specialty: 'Cardiology',
                  date: 'May 20, 2026',
                  time: '10:00 AM',
                  status: 'confirmed'
                },
                {
                  id: 2,
                  doctor: 'Dr. Johnson',
                  specialty: 'Dermatology',
                  date: 'May 22, 2026',
                  time: '2:00 PM',
                  status: 'pending'
                }
              ]}
            />

            <section className="mc-dashboard__card">
              <h2>Your Profile</h2>
              <div className="mc-dashboard__profile">
                <div>
                  <span>Email</span>
                  <p>{profile.email}</p>
                </div>
                <div>
                  <span>Phone</span>
                  <p>{profile.phone}</p>
                </div>
                <div>
                  <span>Date of Birth</span>
                  <p>{profile.date_of_birth || 'Not provided'}</p>
                </div>
              </div>
              <button
                className="mc-dashboard__button mc-dashboard__button--ghost"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
            </section>

            <section className="mc-dashboard__card">
              <h2>Quick Actions</h2>
              <div className="mc-dashboard__actions">
                <button className="mc-dashboard__action">Find a Specialist</button>
                <button className="mc-dashboard__action">View Prescriptions</button>
                <button className="mc-dashboard__action">Message Support</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardPage;