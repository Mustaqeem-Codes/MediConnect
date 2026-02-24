import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import AppointmentMessages from '../components/messages/AppointmentMessages';
import VideoCallModal from '../components/VideoCallModal';
import ReportSubmissionModal from '../components/ReportSubmissionModal';
import { useToast } from '../components/Toast';
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
  const location = useLocation();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);
  const [activeAppointmentStatus, setActiveAppointmentStatus] = useState('');
  const [activeInteractionClosed, setActiveInteractionClosed] = useState(false);
  const [requestingFullRecordId, setRequestingFullRecordId] = useState(null);
  const [reviewingPatientId, setReviewingPatientId] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAppointments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

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
        const errorMessage = data.error || 'Failed to load appointments';
        throw new Error(errorMessage);
      }

      if (!data.data || !Array.isArray(data.data)) {
        setAppointments([]);
        return;
      }

      const mapped = data.data.map((item) => ({
        id: item.id,
        globalSequenceId: item.global_sequence_id,
        patient: item.patient_name || 'Unknown Patient',
        patientId: item.patient_id,
        specialty: item.reason || 'Consultation',
        date: formatDate(item.appointment_date),
        time: formatTime(item.appointment_time),
        status: item.status || 'pending',
        consultationType: item.consultation_type || 'physical_checkup',
        appointmentType: item.appointment_type || item.consultation_type || 'physical_checkup',
        durationUnits: item.duration_units,
        videoRoomId: item.video_room_id,
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
        const errorMsg = data.error || 'Failed to update appointment';
        throw new Error(errorMsg);
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? { ...item, status: data.data.status, videoRoomId: data.data.video_room_id ?? item.videoRoomId }
            : item
        )
      );
      toast.success(`Appointment ${nextStatus} successfully`);
    } catch (err) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenReportModal = (appointment) => {
    setReportModalData({
      appointmentId: appointment.id,
      patientName: appointment.patient
    });
  };

  const handleSubmitReportFromModal = async ({ appointmentId, treatmentSummary, medicalReport, medicines, prescriptions, recommendations, files }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=doctor');
      return;
    }

    // For file upload, we would use FormData in a real implementation
    // For now, we'll just submit the text data
    const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/report`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        treatment_summary: treatmentSummary,
        medical_report: medicalReport,
        medicines,
        prescriptions,
        recommendations,
        attachment_count: files.length // Track attachment count
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
    toast.success('Report submitted successfully');
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
        const errorMsg = data.error || 'Failed to request full record access';
        throw new Error(errorMsg);
      }

      toast.success('Full record access request sent to patient');
    } catch (err) {
      const errorMsg = err.message || 'Failed to request record access';
      setError(errorMsg);
      toast.error(errorMsg);
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
        const errorMsg = data.error || 'Failed to load full patient history';
        // Handle specific error cases
        if (response.status === 403) {
          toast.warning('Full record access has not been granted by the patient yet');
        } else if (response.status === 404) {
          toast.info('No medical records found for this patient');
        } else {
          throw new Error(errorMsg);
        }
        return;
      }

      if (!data.data || data.data.length === 0) {
        toast.info('No previous medical records found for this patient');
      } else {
        toast.success(`Found ${data.data.length} medical record(s)`);
        window.alert(`Full patient history records available: ${data.data.length}\n\nRecords include treatment summaries, reports, and prescriptions from previous consultations.`);
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to load patient records';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleJoinVideoCall = (roomId) => {
    setActiveVideoCall(roomId);
  };

  const handleEndVideoCall = () => {
    setActiveVideoCall(null);
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

      toast.success('Patient review submitted successfully');
      await maybeSubmitSoftwareReview();
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit review';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setReviewingPatientId(null);
    }
  };

  return (
    <div className="mc-doctor-appointments">
      <DoctorSidebar />
      <main className="mc-doctor-appointments__content">
        <header className="mc-doctor-appointments__header">
          <div className="mc-doctor-appointments__header-content">
            <div>
              <h1>Appointments</h1>
              <p>Manage your upcoming visits and patient requests.</p>
            </div>
            <button
              type="button"
              className="mc-doctor-appointments__refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh appointments"
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </header>

        {loading && <div className="mc-doctor-appointments__state">Loading appointments...</div>}
        {error && (
          <div className="mc-doctor-appointments__error">
            <span className="mc-doctor-appointments__error-icon">⚠</span>
            <span>{error}</span>
            <button 
              type="button" 
              className="mc-doctor-appointments__error-retry"
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <section className="mc-doctor-appointments__card">
            {appointments.length === 0 ? (
              <div className="mc-doctor-appointments__empty">
                <p>No appointments found</p>
                <span>Patients will appear here when they book consultations with you.</span>
              </div>
            ) : (
            <div className="mc-doctor-appointments__list">
              {appointments.map((item) => (
                <div key={item.id} className="mc-doctor-appointments__item">
                  <div>
                    <p className="mc-doctor-appointments__name">{item.patient}</p>
                    <span className="mc-doctor-appointments__meta">{item.specialty}</span>
                    <span className={`mc-doctor-appointments__type mc-doctor-appointments__type--${item.consultationType === 'video_consultation' ? 'video' : 'physical'}`}>
                      {item.consultationType === 'video_consultation' ? '📹 Video Consultation' : '🏥 Physical Checkup'}
                    </span>
                    <span className="mc-doctor-appointments__meta">
                      Queue #{item.globalSequenceId ?? '—'} · Duration {Number(item.durationUnits || 0) * 10} min
                    </span>
                    {item.latestMedicalReport ? (
                      <div className="mc-doctor-appointments__record-preview">
                        <span className="mc-doctor-appointments__record-label">Latest record:</span>
                        <span className="mc-doctor-appointments__record-text">
                          {item.latestTreatmentSummary || item.latestMedicalReport}
                        </span>
                      </div>
                    ) : (
                      <div className="mc-doctor-appointments__no-record">
                        <span className="mc-doctor-appointments__no-record-icon">📋</span>
                        <span>No previous medical records</span>
                        <span className="mc-doctor-appointments__no-record-hint">
                          This may be the patient&apos;s first consultation
                        </span>
                      </div>
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
                    {item.status === 'confirmed' && item.consultationType === 'video_consultation' && item.videoRoomId && (
                      <button
                        type="button"
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--video"
                        onClick={() => handleJoinVideoCall(item.videoRoomId)}
                      >
                        📹 Join Video Call
                      </button>
                    )}
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
                        className="mc-doctor-appointments__btn mc-doctor-appointments__btn--submit-report"
                        onClick={() => handleOpenReportModal(item)}
                      >
                        📝 Submit Report
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
            )}
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

        {activeVideoCall && (
          <VideoCallModal
            roomId={activeVideoCall}
            role="doctor"
            onClose={handleEndVideoCall}
          />
        )}

        {reportModalData && (
          <ReportSubmissionModal
            appointmentId={reportModalData.appointmentId}
            patientName={reportModalData.patientName}
            onClose={() => setReportModalData(null)}
            onSubmit={handleSubmitReportFromModal}
          />
        )}
      </main>
    </div>
  );
};

export default DoctorAppointmentsPage;
