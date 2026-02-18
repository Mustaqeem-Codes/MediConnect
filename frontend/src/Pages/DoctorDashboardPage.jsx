import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import '../styles/DoctorDashboardPage.css';

const DoctorDashboardPage = () => {
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
        const response = await fetch('http://localhost:5000/api/doctors/profile', {
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

  return (
    <div className="mc-doctor-dashboard-layout">
      <DoctorSidebar />
      <div className="mc-doctor-dashboard">
        <header className="mc-doctor-dashboard__header">
          <div>
            <p className="mc-doctor-dashboard__eyebrow">Doctor Dashboard</p>
            <h1 className="mc-doctor-dashboard__title">
              {profile ? `Welcome, Dr. ${profile.name}!` : 'Welcome'}
            </h1>
            <p className="mc-doctor-dashboard__subtitle">Today at a glance.</p>
          </div>
          <button onClick={handleLogout} className="mc-doctor-dashboard__logout">Logout</button>
        </header>

        {loading && <div className="mc-doctor-dashboard__state">Loading your profile...</div>}
        {error && <div className="mc-doctor-dashboard__error">{error}</div>}

        {!loading && !error && (
          <div className="mc-doctor-dashboard__grid">
            <section className="mc-doctor-dashboard__card">
              <h2>Upcoming Appointments</h2>
              <ul className="mc-doctor-dashboard__list">
                <li>10:00 AM - Emily Carter (Cardiology)</li>
                <li>1:30 PM - Michael Brown (Dermatology)</li>
              </ul>
            </section>

            <section className="mc-doctor-dashboard__card">
              <h2>Patient Queue</h2>
              <p className="mc-doctor-dashboard__muted">3 patients waiting for review.</p>
              <button className="mc-doctor-dashboard__button">Review Requests</button>
            </section>

            <section className="mc-doctor-dashboard__card">
              <h2>Earnings</h2>
              <p className="mc-doctor-dashboard__metric">$1,240</p>
              <span className="mc-doctor-dashboard__muted">This month</span>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
