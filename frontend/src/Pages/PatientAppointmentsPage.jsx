import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import AppointmentMessages from '../components/messages/AppointmentMessages';
import '../styles/PatientAppointmentsPage.css';
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
  date.setHours(Number(hours), Number(minutes || 0));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const PatientAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [activeAppointmentStatus, setActiveAppointmentStatus] = useState('');
  const [activeInteractionClosed, setActiveInteractionClosed] = useState(false);
  const [reviewingDoctorId, setReviewingDoctorId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=patient');
      return;
    }

    const loadAppointments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/appointments/patient`, {
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
          status: item.status || 'pending',
          reportSubmittedAt: item.report_submitted_at,
          interactionClosedAt: item.interaction_closed_at,
          treatmentSummary: item.treatment_summary,
          medicalReport: item.medical_report,
          medicines: item.medicines,
          prescriptions: item.prescriptions,
          recommendations: item.recommendations,
          patientReviewSubmitted: item.patient_review_submitted
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

  const handleReviewDoctor = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=patient');
      return;
    }

    const maybeSubmitSoftwareReview = async () => {
      const wants = window.confirm('Would you like to rate the MediConnect software too? (optional)');
      if (!wants) return;

      const softwareRatingInput = window.prompt('Rate MediConnect software from 1 to 5:');
      if (!softwareRatingInput) return;
      const softwareRating = Number.parseInt(softwareRatingInput, 10);
      if (!Number.isInteger(softwareRating) || softwareRating < 1 || softwareRating > 5) {
        return;
      }

      const softwareReviewText = window.prompt('Optional software feedback:', '') || '';
      await fetch(`${API_BASE_URL}/api/reviews/software`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating: softwareRating, review_text: softwareReviewText })
      });
    };

    const ratingInput = window.prompt('Rate doctor from 1 to 5 (mandatory):');
    if (!ratingInput) return;
    const rating = Number.parseInt(ratingInput, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    const reviewText = window.prompt('Optional review text:', '') || '';

    setReviewingDoctorId(appointmentId);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/appointments/${appointmentId}/doctor`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, review_text: reviewText })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit doctor review');
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, patientReviewSubmitted: true } : item
        )
      );

      await maybeSubmitSoftwareReview();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingDoctorId(null);
    }
  };

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
        {!loading && !error && (
          <section className="mc-patient-appointments__card">
            <div className="mc-patient-appointments__list">
              {appointments.length === 0 ? (
                <div className="mc-patient-appointments__empty">
                  <p>No appointments scheduled yet.</p>
                  <span>Start by booking a visit with a specialist.</span>
                </div>
              ) : (
                appointments.map((item) => (
                  <div key={item.id} className="mc-patient-appointments__item">
                    <div>
                      <p className="mc-patient-appointments__name">{item.doctor}</p>
                      <span className="mc-patient-appointments__meta">{item.specialty}</span>
                    </div>
                    <div className="mc-patient-appointments__time">
                      <span>{item.date}</span>
                      <span>{item.time}</span>
                    </div>
                    <div className="mc-patient-appointments__actions">
                      <span className={`mc-patient-appointments__status mc-patient-appointments__status--${item.status}`}>
                        {item.status}
                      </span>
                      {!item.interactionClosedAt && (
                        <button
                          type="button"
                          className="mc-patient-appointments__message"
                          onClick={() => {
                            setActiveAppointmentId(item.id);
                            setActiveAppointmentStatus(item.status);
                            setActiveInteractionClosed(Boolean(item.interactionClosedAt));
                          }}
                        >
                          Message
                        </button>
                      )}
                    </div>
                    {item.reportSubmittedAt && (
                      <div className="mc-patient-appointments__meta">
                        <strong>Treatment:</strong> {item.treatmentSummary || 'N/A'}<br />
                        <strong>Medical Report:</strong> {item.medicalReport || 'N/A'}<br />
                        <strong>Medicines:</strong> {Array.isArray(item.medicines) && item.medicines.length > 0 ? item.medicines.join(', ') : 'N/A'}<br />
                        <strong>Prescriptions:</strong> {item.prescriptions || 'N/A'}<br />
                        <strong>Recommendations:</strong> {item.recommendations || 'N/A'}
                      </div>
                    )}
                    {item.reportSubmittedAt && !item.patientReviewSubmitted && (
                      <button
                        type="button"
                        className="mc-patient-appointments__message"
                        onClick={() => handleReviewDoctor(item.id)}
                        disabled={reviewingDoctorId === item.id}
                      >
                        {reviewingDoctorId === item.id ? 'Submitting...' : 'Review Doctor'}
                      </button>
                    )}
                    {item.interactionClosedAt && !item.reportSubmittedAt && (
                      <div className="mc-patient-appointments__meta">Consultation closed.</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeAppointmentId && (
          <AppointmentMessages
            appointmentId={activeAppointmentId}
            appointmentStatus={activeAppointmentStatus}
            interactionClosed={activeInteractionClosed}
            role="patient"
            onClose={() => setActiveAppointmentId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default PatientAppointmentsPage;
