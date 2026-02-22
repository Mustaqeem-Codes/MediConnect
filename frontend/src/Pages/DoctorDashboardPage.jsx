import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import '../styles/DoctorDashboardPage.css';
import { API_BASE_URL } from '../config/api';

const formatDate = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return 'TBD';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const DEFAULT_CUSTOM_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00'];

const HOUR_SLOTS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);

const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [availabilityMode, setAvailabilityMode] = useState('custom');
  const [availabilitySlots, setAvailabilitySlots] = useState(DEFAULT_CUSTOM_SLOTS);
  const [savingAvailability, setSavingAvailability] = useState(false);
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
        const [profileRes, apptRes, notificationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/doctors/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/appointments/doctor`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/doctors/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [profileData, apptData, notificationsData] = await Promise.all([
          profileRes.json(),
          apptRes.json(),
          notificationsRes.json()
        ]);
        if (!profileRes.ok) {
          throw new Error(profileData.error || 'Failed to load profile');
        }
        if (!apptRes.ok) {
          throw new Error(apptData.error || 'Failed to load appointments');
        }
        if (!notificationsRes.ok) {
          throw new Error(notificationsData.error || 'Failed to load notifications');
        }

        setProfile(profileData.data);

        const profileSlots = Array.isArray(profileData.data?.availability_slots)
          ? profileData.data.availability_slots
          : [];
        if (profileData.data?.availability_mode === '24_7') {
          setAvailabilityMode('24_7');
        } else {
          setAvailabilityMode('custom');
          if (profileSlots.length > 0) {
            setAvailabilitySlots(profileSlots);
          } else {
            setAvailabilitySlots(DEFAULT_CUSTOM_SLOTS);
          }
        }

        setAppointments(apptData.data || []);
        setNotifications(notificationsData.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSaveAvailability = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    setSavingAvailability(true);
    setError('');

    try {
      const slots = Array.isArray(availabilitySlots)
        ? Array.from(new Set(availabilitySlots)).sort()
        : [];

      const response = await fetch(`${API_BASE_URL}/api/doctors/availability`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          availability_mode: availabilityMode,
          availability_slots: availabilityMode === '24_7' ? [] : slots
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save availability');
      }

      setProfile((prev) => prev ? {
        ...prev,
        availability_mode: data.data.availability_mode,
        availability_slots: data.data.availability_slots,
        should_set_availability: false
      } : prev);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAvailability(false);
    }
  };

  const toggleSlot = (slot) => {
    setAvailabilitySlots((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot];
    });
  };

  const upcomingAppointments = appointments
    .filter((item) => ['pending', 'confirmed'].includes(item.status))
    .slice(0, 5);

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
        </header>

        {loading && <div className="mc-doctor-dashboard__state">Loading your profile...</div>}
        {error && <div className="mc-doctor-dashboard__error">{error}</div>}

        {!loading && !error && (
          <div className="mc-doctor-dashboard__grid">
            <section className="mc-doctor-dashboard__card">
              <h2>Upcoming Appointments</h2>
              <ul className="mc-doctor-dashboard__list">
                {upcomingAppointments.length === 0 ? (
                  <li>No upcoming appointments.</li>
                ) : upcomingAppointments.map((item) => (
                  <li key={item.id}>
                    {formatDate(item.appointment_date)} · {formatTime(item.appointment_time)} - {item.patient_name}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mc-doctor-dashboard__card">
              <h2>Verification & Availability</h2>
              {!profile?.is_approved ? (
                <p className="mc-doctor-dashboard__muted">Your profile is pending admin verification.</p>
              ) : (
                <>
                  <p className="mc-doctor-dashboard__muted">
                    {profile?.should_set_availability
                      ? 'You are verified. Please set your timetable and availability so patients can book appointments.'
                      : 'Your timetable is configured and visible to patients.'}
                  </p>

                  <div className="mc-doctor-dashboard__actions">
                    <label>
                      <input
                        type="radio"
                        name="availabilityMode"
                        value="custom"
                        checked={availabilityMode === 'custom'}
                        onChange={() => setAvailabilityMode('custom')}
                      />
                      Custom slots
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="availabilityMode"
                        value="24_7"
                        checked={availabilityMode === '24_7'}
                        onChange={() => setAvailabilityMode('24_7')}
                      />
                      24/7
                    </label>
                  </div>

                  {availabilityMode === 'custom' && (
                    <>
                      <p className="mc-doctor-dashboard__muted" style={{ marginTop: '0.75rem' }}>
                        Select the hours you are available. Patients book in hourly windows with capacity-based queueing.
                      </p>
                      <div className="mc-doctor-dashboard__slot-grid" role="group" aria-label="Availability hours">
                        {HOUR_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={availabilitySlots.includes(slot)
                              ? 'mc-doctor-dashboard__slot-btn is-active'
                              : 'mc-doctor-dashboard__slot-btn'}
                            onClick={() => toggleSlot(slot)}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    className="mc-doctor-dashboard__button"
                    onClick={handleSaveAvailability}
                    disabled={savingAvailability}
                  >
                    {savingAvailability ? 'Saving...' : 'Save Availability'}
                  </button>
                </>
              )}
            </section>

            <section className="mc-doctor-dashboard__card">
              <h2>Summary</h2>
              <p className="mc-doctor-dashboard__metric">{appointments.length}</p>
              <span className="mc-doctor-dashboard__muted">Total appointments on your account</span>
            </section>

            <section className="mc-doctor-dashboard__card">
              <h2>Notifications</h2>
              {notifications.length === 0 ? (
                <p className="mc-doctor-dashboard__muted">No notifications.</p>
              ) : (
                <ul className="mc-doctor-dashboard__list">
                  {notifications.slice(0, 5).map((item) => (
                    <li key={item.id}>{item.title} - {item.body}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
