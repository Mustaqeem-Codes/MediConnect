import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/BookingPage.css';

const BookingPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const times = ['9:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'];

  const to24Hour = (label) => {
    const [time, period] = label.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = Number(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minutes}:00`;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!appointmentDate || !appointmentTime) {
      setError('Please select a date and time.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: Number(doctorId),
          appointment_date: appointmentDate,
          appointment_time: to24Hour(appointmentTime),
          reason
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setSuccess('Appointment booked successfully.');
      setTimeout(() => navigate('/dashboard/patient/appointments'), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-booking">
      <header className="mc-booking__header">
        <div>
          <p className="mc-booking__eyebrow">Book Appointment</p>
          <h1>Schedule your visit</h1>
          <p>Select a date and time that works for you.</p>
        </div>
      </header>

      <section className="mc-booking__card">
        <div className="mc-booking__summary">
          <h2>Doctor #{doctorId}</h2>
          <p>Specialty: Cardiology</p>
          <p>Location: New York, NY</p>
        </div>

        {error && <div className="mc-booking__error">{error}</div>}
        {success && <div className="mc-booking__success">{success}</div>}

        <div className="mc-booking__grid">
          <div className="mc-booking__panel">
            <h3>Select Date</h3>
            <input
              type="date"
              className="mc-booking__input"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
            />
          </div>
          <div className="mc-booking__panel">
            <h3>Select Time</h3>
            <div className="mc-booking__slots">
              {times.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={appointmentTime === time ? 'is-active' : ''}
                  onClick={() => setAppointmentTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mc-booking__panel">
          <h3>Reason for visit (optional)</h3>
          <textarea
            className="mc-booking__textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Briefly describe your symptoms"
            rows="3"
          />
        </div>

        <button className="mc-booking__cta" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </section>
    </div>
  );
};

export default BookingPage;
