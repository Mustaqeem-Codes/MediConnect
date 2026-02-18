import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import AppointmentsList from '../components/dashboard/AppointmentsList';
import '../styles/PatientAppointmentsPage.css';

const formatDate = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return 'TBD';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes || 0));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const PatientAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadAppointments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:5000/api/appointments/patient', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load appointments');
        }

        const mapped = data.data.map((item) => ({
          id: item.id,
          doctor: item.doctor_name,
          specialty: item.doctor_specialty,
          date: formatDate(item.appointment_date),
          time: formatTime(item.appointment_time),
          status: item.status || 'pending'
        }));

        setAppointments(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [navigate]);

  return (
    <div className="mc-patient-appointments">
      <PatientSidebar />
      <main className="mc-patient-appointments__content">
        <header className="mc-patient-appointments__header">
          <h1>Appointments</h1>
          <p>Track upcoming visits and past consultations.</p>
        </header>

        {loading && <div className="mc-patient-appointments__state">Loading appointments...</div>}
        {error && <div className="mc-patient-appointments__error">{error}</div>}
        {!loading && !error && <AppointmentsList items={appointments} />}
      </main>
    </div>
  );
};

export default PatientAppointmentsPage;
