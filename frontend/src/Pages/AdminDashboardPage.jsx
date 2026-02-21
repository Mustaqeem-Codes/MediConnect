import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import '../styles/AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const token = localStorage.getItem('token');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?role=admin');
  };

  const loadData = async () => {
    if (!token) {
      navigate('/login?role=admin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [overviewRes, doctorsRes, patientsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/overview`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/doctors`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/patients`, { headers: authHeaders })
      ]);

      const [overviewData, doctorsData, patientsData] = await Promise.all([
        overviewRes.json(),
        doctorsRes.json(),
        patientsRes.json()
      ]);

      if (!overviewRes.ok) throw new Error(overviewData.error || 'Failed to load overview');
      if (!doctorsRes.ok) throw new Error(doctorsData.error || 'Failed to load doctors');
      if (!patientsRes.ok) throw new Error(patientsData.error || 'Failed to load patients');

      setOverview(overviewData.data);
      setDoctors(doctorsData.data || []);
      setPatients(patientsData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateDoctorVerification = async (doctorId, approved) => {
    const key = `verify-${doctorId}`;
    setActionLoading(key);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/verify`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ approved })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update verification');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const updateDoctorBlocked = async (doctorId, blocked) => {
    const key = `doctor-block-${doctorId}`;
    setActionLoading(key);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/block`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ blocked })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update doctor block status');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const updatePatientBlocked = async (patientId, blocked) => {
    const key = `patient-block-${patientId}`;
    setActionLoading(key);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/patients/${patientId}/block`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ blocked })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update patient block status');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="mc-admin">
      <header className="mc-admin__header">
        <div>
          <p className="mc-admin__eyebrow">Admin Control Center</p>
          <h1>Platform Administration</h1>
          <p>Manage doctors, patients, and critical moderation actions.</p>
        </div>
        <button type="button" className="mc-admin__logout" onClick={handleLogout}>Logout</button>
      </header>

      {loading && <div className="mc-admin__state">Loading admin data...</div>}
      {error && <div className="mc-admin__error">{error}</div>}

      {!loading && !error && overview && (
        <>
          <section className="mc-admin__stats">
            <article className="mc-admin__stat">
              <h3>Patients</h3>
              <p>{overview.patients}</p>
            </article>
            <article className="mc-admin__stat">
              <h3>Doctors</h3>
              <p>{overview.doctors}</p>
            </article>
            <article className="mc-admin__stat">
              <h3>Appointments</h3>
              <p>{overview.appointments}</p>
            </article>
            <article className="mc-admin__stat">
              <h3>Pending Verification</h3>
              <p>{overview.pending_doctor_approvals}</p>
            </article>
          </section>

          <section className="mc-admin__panel">
            <h2>Doctors Management</h2>
            <div className="mc-admin__table-wrap">
              <table className="mc-admin__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Specialty</th>
                    <th>Verified</th>
                    <th>Blocked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.specialty}</td>
                      <td>{doctor.is_approved ? 'Yes' : 'No'}</td>
                      <td>{doctor.is_blocked ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="mc-admin__actions">
                          <button
                            type="button"
                            disabled={actionLoading === `verify-${doctor.id}`}
                            onClick={() => updateDoctorVerification(doctor.id, !doctor.is_approved)}
                          >
                            {doctor.is_approved ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === `doctor-block-${doctor.id}`}
                            onClick={() => updateDoctorBlocked(doctor.id, !doctor.is_blocked)}
                          >
                            {doctor.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mc-admin__panel">
            <h2>Patients Management</h2>
            <div className="mc-admin__table-wrap">
              <table className="mc-admin__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Blocked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.name}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone}</td>
                      <td>{patient.is_blocked ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          type="button"
                          disabled={actionLoading === `patient-block-${patient.id}`}
                          onClick={() => updatePatientBlocked(patient.id, !patient.is_blocked)}
                        >
                          {patient.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
