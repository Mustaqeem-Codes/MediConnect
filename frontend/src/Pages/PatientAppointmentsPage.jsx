import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import AppointmentMessages from '../components/messages/AppointmentMessages';
import VideoCallModal from '../components/VideoCallModal';
import { useToast } from '../components/Toast';
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
  const location = useLocation();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [activeAppointmentStatus, setActiveAppointmentStatus] = useState('');
  const [activeInteractionClosed, setActiveInteractionClosed] = useState(false);
  const [reviewingDoctorId, setReviewingDoctorId] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAppointments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=patient');
      return;
    }

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
        const errorMessage = data.error || 'Failed to load appointments';
        throw new Error(errorMessage);
      }

      if (!data.data || !Array.isArray(data.data)) {
        setAppointments([]);
        return;
      }

      const mapped = data.data.map((item) => ({
        id: item.id,
        doctor: item.doctor_name || 'Unknown Doctor',
        specialty: item.doctor_specialty || 'General Practice',
        date: formatDate(item.appointment_date),
        time: formatTime(item.appointment_time),
        status: item.status || 'pending',
        consultationType: item.consultation_type || 'physical_checkup',
        videoRoomId: item.video_room_id,
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
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  // Auto-refresh when navigating back to this page
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, location.key, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.info('Refreshing appointments...');
  };

  const handleJoinVideoCall = (roomId) => {
    setActiveVideoCall(roomId);
  };

  const handleEndVideoCall = () => {
    setActiveVideoCall(null);
  };

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

      toast.success('Doctor review submitted successfully');
      await maybeSubmitSoftwareReview();
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit review';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setReviewingDoctorId(null);
    }
  };

  return (
    <div className="mc-patient-appointments">
      <PatientSidebar />
      <main className="mc-patient-appointments__content">
        <header className="mc-patient-appointments__header">
          <div className="mc-patient-appointments__header-content">
            <div>
              <h1>Appointments</h1>
              <p>Track upcoming visits and past consultations.</p>
            </div>
            <button
              type="button"
              className="mc-patient-appointments__refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh appointments"
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </header>

        {loading && <div className="mc-patient-appointments__state">Loading appointments...</div>}
        {error && (
          <div className="mc-patient-appointments__error">
            <span className="mc-patient-appointments__error-icon">⚠</span>
            <span>{error}</span>
            <button 
              type="button" 
              className="mc-patient-appointments__error-retry"
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}
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
                      {item.status === 'confirmed' && item.consultationType === 'video_consultation' && item.videoRoomId && (
                        <button
                          type="button"
                          className="mc-patient-appointments__btn mc-patient-appointments__btn--video"
                          onClick={() => handleJoinVideoCall(item.videoRoomId)}
                        >
                          📹 Join Video Call
                        </button>
                      )}
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

        {activeVideoCall && (
          <VideoCallModal
            roomId={activeVideoCall}
            role="patient"
            onClose={handleEndVideoCall}
          />
        )}
      </main>
    </div>
  );
};

export default PatientAppointmentsPage;
