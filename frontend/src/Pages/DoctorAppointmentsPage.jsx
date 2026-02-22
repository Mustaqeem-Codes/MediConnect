import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import AppointmentMessages from '../components/messages/AppointmentMessages';
import '../styles/DoctorAppointmentsPage.css';
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

const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [activeAppointmentStatus, setActiveAppointmentStatus] = useState('');
  const [activeInteractionClosed, setActiveInteractionClosed] = useState(false);
  const [submittingReportId, setSubmittingReportId] = useState(null);
  const [requestingFullRecordId, setRequestingFullRecordId] = useState(null);
  const [reviewingPatientId, setReviewingPatientId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    const loadAppointments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/appointments/doctor`, {
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
          globalSequenceId: item.global_sequence_id,
          patient: item.patient_name,
          specialty: item.reason || 'Consultation',
          date: formatDate(item.appointment_date),
          time: formatTime(item.appointment_time),
          status: item.status || 'pending',
          consultationType: item.consultation_type || 'physical_checkup',
          appointmentType: item.appointment_type || item.consultation_type || 'physical_checkup',
          durationUnits: item.duration_units,
          reportSubmittedAt: item.report_submitted_at,
          interactionClosedAt: item.interaction_closed_at,
          treatmentSummary: item.treatment_summary,
          medicalReport: item.medical_report,
          medicines: item.medicines,
          prescriptions: item.prescriptions,
          recommendations: item.recommendations,
          latestTreatmentSummary: item.latest_treatment_summary,
          latestMedicalReport: item.latest_medical_report,
          latestMedicines: item.latest_medicines,
          latestReportSubmittedAt: item.latest_report_submitted_at,
          doctorReviewSubmitted: item.doctor_review_submitted
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

  const handleStatusUpdate = async (appointmentId, nextStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    if (nextStatus === 'rejected') {
      const confirmReject = window.confirm('Are you sure you want to reject this appointment?');
      if (!confirmReject) return;
    }

    setUpdatingId(appointmentId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment');
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, status: data.data.status } : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmitReport = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    const treatmentSummary = window.prompt('Enter treatment summary:');
    if (!treatmentSummary || !treatmentSummary.trim()) return;

    const medicalReport = window.prompt('Enter medical report/analysis:');
    if (!medicalReport || !medicalReport.trim()) return;

    const medicinesInput = window.prompt('Enter medicines (comma separated), if any:', '');
    const prescriptions = window.prompt('Enter prescriptions (optional):', '') || '';
    const recommendations = window.prompt('Enter recommendations/tests/advice (optional):', '') || '';

    const medicines = (medicinesInput || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmittingReportId(appointmentId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/report`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          treatment_summary: treatmentSummary.trim(),
          medical_report: medicalReport.trim(),
          medicines,
          prescriptions,
          recommendations
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                status: data.data.status,
                reportSubmittedAt: data.data.report_submitted_at,
                interactionClosedAt: data.data.interaction_closed_at,
                treatmentSummary: data.data.treatment_summary,
                medicalReport: data.data.medical_report,
                medicines: data.data.medicines,
                prescriptions: data.data.prescriptions,
                recommendations: data.data.recommendations
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReportId(null);
    }
  };

  const handleRequestFullRecord = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    const reason = window.prompt('Reason for requesting full history (optional):', '') || '';

    setRequestingFullRecordId(appointmentId);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/patient-record/request-access`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request full record access');
      }

      window.alert('Full record access request sent to patient.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingFullRecordId(null);
    }
  };

  const handleViewFullRecord = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/patient-record/full`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load full patient history');
      }

      window.alert(`Full patient history records available: ${data.data.length}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewPatient = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
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

    const ratingInput = window.prompt('Rate patient from 1 to 5:');
    if (!ratingInput) return;
    const rating = Number.parseInt(ratingInput, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    const reviewText = window.prompt('Optional note about this patient:', '') || '';

    setReviewingPatientId(appointmentId);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/appointments/${appointmentId}/patient`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, review_text: reviewText })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit patient review');
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, doctorReviewSubmitted: true } : item
        )
      );

      await maybeSubmitSoftwareReview();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingPatientId(null);
    }
  };

  return (
    <div className="mc-doctor-appointments">
      <DoctorSidebar />
      <main className="mc-doctor-appointments__content">
        <header className="mc-doctor-appointments__header">
          <h1>Appointments</h1>
          <p>Manage your upcoming visits and patient requests.</p>
        </header>

        {loading && <div className="mc-doctor-appointments__state">Loading appointments...</div>}
        {error && <div className="mc-doctor-appointments__error">{error}</div>}

        {!loading && !error && (
          <section className="mc-doctor-appointments__card">
            <div className="mc-doctor-appointments__list">
              {appointments.map((item) => (
                <div key={item.id} className="mc-doctor-appointments__item">
                  <div>
                    <p className="mc-doctor-appointments__name">{item.patient}</p>
                    <span className="mc-doctor-appointments__meta">{item.specialty}</span>
                    <span className="mc-doctor-appointments__meta">
                      Queue #{item.globalSequenceId ?? '—'} · Duration {Number(item.durationUnits || 0) * 10} min
                    </span>
                    {item.latestMedicalReport && (
                      <span className="mc-doctor-appointments__meta">
                        Latest record: {item.latestTreatmentSummary || item.latestMedicalReport}
                      </span>
                    )}
                    {!item.latestMedicalReport && (
                      <span className="mc-doctor-appointments__meta">Latest record: No record yet.</span>
                    )}
                  </div>
                  <div className="mc-doctor-appointments__time">
                    <span>{item.date}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="mc-doctor-appointments__actions">
                    <span className={`mc-doctor-appointments__status mc-doctor-appointments__status--${item.status}`}>
                      {item.status}
                    </span>
                    {item.status === 'pending' && (
                      <div className="mc-doctor-appointments__buttons">
                        <button
                          type="button"
                          className="mc-doctor-appointments__btn mc-doctor-appointments__btn--confirm"
                          onClick={() => handleStatusUpdate(item.id, 'confirmed')}
                          disabled={updatingId === item.id}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="mc-doctor-appointments__btn mc-doctor-appointments__btn--reject"
                          onClick={() => handleStatusUpdate(item.id, 'rejected')}
                          disabled={updatingId === item.id}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {item.status === 'confirmed' && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--confirm"
                        onClick={() => handleStatusUpdate(item.id, 'completed')}
                        disabled={updatingId === item.id}
                      >
                        Mark Completed
                      </button>
                    )}
                    {(item.status === 'completed' && !item.reportSubmittedAt) && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--message"
                        onClick={() => handleSubmitReport(item.id)}
                        disabled={submittingReportId === item.id}
                      >
                        {submittingReportId === item.id ? 'Submitting...' : 'Submit Report'}
                      </button>
                    )}
                    {['pending', 'confirmed', 'rejected'].includes(item.status) && !item.interactionClosedAt && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--message"
                        onClick={() => {
                          setActiveAppointmentId(item.id);
                          setActiveAppointmentStatus(item.status);
                          setActiveInteractionClosed(Boolean(item.interactionClosedAt));
                        }}
                      >
                        Message
                      </button>
                    )}
                    {item.reportSubmittedAt && (
                      <span className="mc-doctor-appointments__meta">Report submitted</span>
                    )}
                    {['confirmed', 'completed'].includes(item.status) && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--message"
                        onClick={() => handleRequestFullRecord(item.id)}
                        disabled={requestingFullRecordId === item.id}
                      >
                        {requestingFullRecordId === item.id ? 'Requesting...' : 'Request Full Record'}
                      </button>
                    )}
                    {['confirmed', 'completed'].includes(item.status) && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--message"
                        onClick={() => handleViewFullRecord(item.id)}
                      >
                        View Full Record
                      </button>
                    )}
                    {item.reportSubmittedAt && !item.doctorReviewSubmitted && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--message"
                        onClick={() => handleReviewPatient(item.id)}
                        disabled={reviewingPatientId === item.id}
                      >
                        {reviewingPatientId === item.id ? 'Submitting...' : 'Review Patient'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeAppointmentId && (
          <AppointmentMessages
            appointmentId={activeAppointmentId}
            appointmentStatus={activeAppointmentStatus}
            interactionClosed={activeInteractionClosed}
            role="doctor"
            onClose={() => setActiveAppointmentId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default DoctorAppointmentsPage;
