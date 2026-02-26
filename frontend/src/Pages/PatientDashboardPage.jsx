import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import PatientSidebar from '../components/dashboard/PatientSidebar';
import { useToast } from '../components/Toast';
import '../styles/PatientDashboardPage.css';
import { API_BASE_URL } from '../config/api';

const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedAppointment, setExpandedAppointment] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Parse vitals from clinical_findings
  const parseVitals = (clinicalFindings) => {
    if (!clinicalFindings) return null;
    const match = clinicalFindings.match(/<!--VITALS_JSON-->(.*?)<!--\/VITALS_JSON-->/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Get clinical findings text without vitals JSON
  const getClinicalText = (clinicalFindings) => {
    if (!clinicalFindings) return '';
    return clinicalFindings.replace(/<!--VITALS_JSON-->.*?<!--\/VITALS_JSON-->\n?/s, '').trim();
  };

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?role=patient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [profileRes, appointmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API_BASE_URL}/api/appointments/patient`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const [profileData, appointmentsData] = await Promise.all([
        profileRes.json(),
        appointmentsRes.json()
      ]);

      if (!profileRes.ok) {
        const errorMsg = profileData.error || 'Failed to load profile';
        throw new Error(errorMsg);
      }
      if (!appointmentsRes.ok) {
        const errorMsg = appointmentsData.error || 'Failed to load appointments';
        throw new Error(errorMsg);
      }

      setProfile(profileData.data);
      // Map all appointments with full report data, sorted by date (latest first)
      const mapped = (appointmentsData.data || [])
        .map((item) => ({
          id: item.id,
          doctor: item.doctor_name || 'Unknown Doctor',
          specialty: item.doctor_specialty || 'General Practice',
          date: item.appointment_date,
          time: item.appointment_time,
          status: item.status || 'pending',
          consultation_type: item.consultation_type,
          reason: item.reason,
          // Report data
          treatment_summary: item.treatment_summary,
          medical_report: item.medical_report,
          medicines: item.medicines,
          prescriptions: item.prescriptions,
          recommendations: item.recommendations,
          diagnosis: item.diagnosis,
          medication_array: item.medication_array,
          clinical_findings: getClinicalText(item.clinical_findings),
          vitals: parseVitals(item.clinical_findings),
          patient_instructions: item.patient_instructions,
          report_submitted_at: item.report_submitted_at,
          hasReport: !!item.report_submitted_at
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
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
    loadProfile();
  }, [loadProfile, location.key, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.info('Refreshing dashboard...');
  };

  const handleEditProfile = () => {
    navigate('/dashboard/patient/profile');
  };

  const toggleAppointmentExpand = (id) => {
    setExpandedAppointment(expandedAppointment === id ? null : id);
  };

  const renderDiagnosis = (diagnosis) => {
    if (!diagnosis || !Array.isArray(diagnosis) || diagnosis.length === 0) return null;
    return (
      <div className="mc-report__section">
        <h5>Diagnosis</h5>
        <ul className="mc-report__diagnosis-list">
          {diagnosis.map((d, idx) => (
            <li key={idx}>
              {d.code && <span className="mc-report__code">{d.code}</span>}
              <span>{d.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderMedications = (medication_array) => {
    if (!medication_array || !Array.isArray(medication_array) || medication_array.length === 0) return null;
    return (
      <div className="mc-report__section">
        <h5>Medications</h5>
        <div className="mc-report__meds-grid">
          {medication_array.map((med, idx) => (
            <div key={idx} className="mc-report__med-card">
              <strong>{med.drug_name}</strong>
              <span>Dosage: {med.dosage || 'N/A'}</span>
              <span>Frequency: {med.frequency || 'N/A'}</span>
              <span>Duration: {med.duration || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVitals = (vitals) => {
    if (!vitals || Object.keys(vitals).length === 0) return null;
    return (
      <div className="mc-report__section">
        <h5>Vitals</h5>
        <div className="mc-report__vitals-grid">
          {vitals.blood_pressure && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Blood Pressure</span>
              <span className="mc-report__vital-value">{vitals.blood_pressure}</span>
            </div>
          )}
          {vitals.pulse_rate && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Pulse Rate</span>
              <span className="mc-report__vital-value">{vitals.pulse_rate}</span>
            </div>
          )}
          {vitals.temperature && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Temperature</span>
              <span className="mc-report__vital-value">{vitals.temperature}</span>
            </div>
          )}
          {vitals.spo2 && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">SpO2</span>
              <span className="mc-report__vital-value">{vitals.spo2}</span>
            </div>
          )}
          {vitals.respiratory_rate && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Respiratory Rate</span>
              <span className="mc-report__vital-value">{vitals.respiratory_rate}</span>
            </div>
          )}
          {vitals.weight && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Weight</span>
              <span className="mc-report__vital-value">{vitals.weight}</span>
            </div>
          )}
          {vitals.height && (
            <div className="mc-report__vital-item">
              <span className="mc-report__vital-label">Height</span>
              <span className="mc-report__vital-value">{vitals.height}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mc-dashboard-layout">
      <PatientSidebar />
      <div className="mc-dashboard">
        <header className="mc-dashboard__header">
          <div className="mc-dashboard__header-content">
            <div>
              <p className="mc-dashboard__eyebrow">Patient Dashboard</p>
              <h1 className="mc-dashboard__title">
                {profile ? `Welcome, ${profile.name}!` : 'Welcome'}
              </h1>
              <p className="mc-dashboard__subtitle">Here is a quick overview of your care.</p>
            </div>
            <div className="mc-dashboard__header-actions">
              <Link to="/doctors" className="mc-dashboard__book-btn">
                + Book Appointment
              </Link>
              <button
                type="button"
                className="mc-dashboard__refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh dashboard"
              >
                {loading ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>
          </div>
        </header>

        {loading && <div className="mc-dashboard__state">Loading your profile...</div>}
        {error && (
          <div className="mc-dashboard__error">
            <span className="mc-dashboard__error-icon">⚠</span>
            <span>{error}</span>
            <button 
              type="button" 
              className="mc-dashboard__error-retry"
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Top row: Profile and Quick Actions side by side */}
            <div className="mc-dashboard__top-row">
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
                  <div>
                    <span>Location</span>
                    <p>{profile.location || 'Not provided'}</p>
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
                  <Link to="/doctors" className="mc-dashboard__action">Find a Specialist</Link>
                  <button className="mc-dashboard__action" onClick={() => setExpandedAppointment(appointments.find(a => a.hasReport)?.id)}>View Medical Records</button>
                  <Link to="/dashboard/patient/messages" className="mc-dashboard__action">Messages</Link>
                </div>
              </section>
            </div>

            {/* Appointments & Medical Records - Full width horizontal card */}
            <section className="mc-dashboard__appointments-section">
              <div className="mc-dashboard__appointments-header">
                <h2>Appointments & Medical Records</h2>
                <span className="mc-dashboard__appointments-count">{appointments.length} total</span>
              </div>

              {appointments.length === 0 ? (
                <div className="mc-dashboard__empty">
                  <p>No appointments scheduled yet.</p>
                  <span>Start by booking a visit with a specialist.</span>
                  <Link to="/doctors" className="mc-dashboard__book-btn mc-dashboard__book-btn--secondary">
                    Book Your First Appointment
                  </Link>
                </div>
              ) : (
                <div className="mc-dashboard__appointments-stack">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className={`mc-dashboard__appointment-card ${expandedAppointment === appointment.id ? 'mc-dashboard__appointment-card--expanded' : ''}`}
                    >
                      <div 
                        className="mc-dashboard__appointment-summary"
                        onClick={() => toggleAppointmentExpand(appointment.id)}
                      >
                        <div className="mc-dashboard__appointment-info">
                          <div className="mc-dashboard__appointment-doctor">
                            <strong>{appointment.doctor}</strong>
                            <span className="mc-dashboard__appointment-specialty">{appointment.specialty}</span>
                          </div>
                          <div className="mc-dashboard__appointment-datetime">
                            <span className="mc-dashboard__appointment-date">{formatDate(appointment.date)}</span>
                            <span className="mc-dashboard__appointment-time">{formatTime(appointment.time)}</span>
                          </div>
                        </div>
                        <div className="mc-dashboard__appointment-meta">
                          <span className={`mc-dashboard__appointment-status mc-dashboard__appointment-status--${appointment.status}`}>
                            {appointment.status}
                          </span>
                          {appointment.hasReport && (
                            <span className="mc-dashboard__appointment-report-badge">Report Available</span>
                          )}
                          <span className="mc-dashboard__appointment-expand-icon">
                            {expandedAppointment === appointment.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {expandedAppointment === appointment.id && (
                        <div className="mc-dashboard__appointment-details">
                          {appointment.reason && (
                            <div className="mc-report__section">
                              <h5>Visit Reason</h5>
                              <p>{appointment.reason}</p>
                            </div>
                          )}

                          {appointment.hasReport ? (
                            <div className="mc-report">
                              <div className="mc-report__header">
                                <h4>Medical Report</h4>
                                <span className="mc-report__date">Submitted: {formatDate(appointment.report_submitted_at)}</span>
                              </div>

                              {renderVitals(appointment.vitals)}

                              {renderDiagnosis(appointment.diagnosis)}

                              {appointment.treatment_summary && (
                                <div className="mc-report__section">
                                  <h5>Treatment Summary</h5>
                                  <p>{appointment.treatment_summary}</p>
                                </div>
                              )}

                              {appointment.medical_report && (
                                <div className="mc-report__section">
                                  <h5>Medical Analysis</h5>
                                  <p>{appointment.medical_report}</p>
                                </div>
                              )}

                              {appointment.clinical_findings && (
                                <div className="mc-report__section">
                                  <h5>Clinical Findings</h5>
                                  <p>{appointment.clinical_findings}</p>
                                </div>
                              )}

                              {renderMedications(appointment.medication_array)}

                              {appointment.prescriptions && (
                                <div className="mc-report__section">
                                  <h5>Prescriptions</h5>
                                  <p>{appointment.prescriptions}</p>
                                </div>
                              )}

                              {appointment.medicines && appointment.medicines.length > 0 && (
                                <div className="mc-report__section">
                                  <h5>Medicines</h5>
                                  <ul className="mc-report__list">
                                    {appointment.medicines.map((med, idx) => (
                                      <li key={idx}>{med}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {appointment.recommendations && (
                                <div className="mc-report__section">
                                  <h5>Recommendations</h5>
                                  <p>{appointment.recommendations}</p>
                                </div>
                              )}

                              {appointment.patient_instructions && (
                                <div className="mc-report__section">
                                  <h5>Patient Instructions</h5>
                                  <p>{appointment.patient_instructions}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mc-report__pending">
                              <span className="mc-report__pending-icon">📋</span>
                              <p>Medical report not yet available.</p>
                              <span>The doctor will submit a report after your appointment is completed.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardPage;