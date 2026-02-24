const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const generateAdminToken = () => {
  return jwt.sign({ id: 0, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide admin email and password'
      });
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'Admin credentials are not configured on server'
      });
    }

    const emailMatches = email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    const passwordMatches = password === process.env.ADMIN_PASSWORD;

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    const token = generateAdminToken();

    res.json({
      success: true,
      data: {
        id: 0,
        name: 'Administrator',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during admin login'
    });
  }
};

const getOverview = async (req, res) => {
  try {
    const [patientsResult, doctorsResult, appointmentsResult, pendingDoctorsResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM patients'),
      pool.query('SELECT COUNT(*)::int AS total FROM doctors'),
      pool.query('SELECT COUNT(*)::int AS total FROM appointments'),
      pool.query('SELECT COUNT(*)::int AS total FROM doctors WHERE is_approved = false')
    ]);

    res.json({
      success: true,
      data: {
        patients: patientsResult.rows[0].total,
        doctors: doctorsResult.rows[0].total,
        appointments: appointmentsResult.rows[0].total,
        pending_doctor_approvals: pendingDoctorsResult.rows[0].total
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const listDoctorsForAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, phone, specialty, license_number, location,
             is_verified, is_approved, is_blocked, created_at
      FROM doctors
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Admin doctors list error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const listPatientsForAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, phone, date_of_birth, location,
             is_verified, is_blocked, created_at
      FROM patients
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Admin patients list error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const setDoctorVerification = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    const { approved } = req.body;

    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor id' });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ success: false, error: 'approved must be a boolean' });
    }

    const result = await pool.query(
      `
      UPDATE doctors
      SET is_approved = $1,
          is_verified = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, is_verified, is_approved
      `,
      [approved, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Admin doctor verification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const setDoctorBlocked = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    const { blocked } = req.body;

    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor id' });
    }

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ success: false, error: 'blocked must be a boolean' });
    }

    const result = await pool.query(
      `
      UPDATE doctors
      SET is_blocked = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, is_blocked
      `,
      [blocked, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Admin doctor block error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const setPatientBlocked = async (req, res) => {
  try {
    const patientId = Number(req.params.id);
    const { blocked } = req.body;

    if (!Number.isInteger(patientId)) {
      return res.status(400).json({ success: false, error: 'Invalid patient id' });
    }

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ success: false, error: 'blocked must be a boolean' });
    }

    const result = await pool.query(
      `
      UPDATE patients
      SET is_blocked = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, is_blocked
      `,
      [blocked, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Admin patient block error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const clearAllData = async (req, res) => {
  try {
    // Delete in order to respect foreign key constraints
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM medical_record_access_requests');
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM patients');
    await pool.query('DELETE FROM doctors');
    // Reset sequences
    await pool.query("ALTER SEQUENCE IF EXISTS appointments_global_sequence RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS patients_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS doctors_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS reviews_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE IF EXISTS medical_record_access_requests_id_seq RESTART WITH 1");

    res.json({
      success: true,
      message: 'All data has been cleared. You can now register new accounts for testing.'
    });
  } catch (error) {
    console.error('Admin clear data error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  loginAdmin,
  getOverview,
  listDoctorsForAdmin,
  listPatientsForAdmin,
  setDoctorVerification,
  setDoctorBlocked,
  setPatientBlocked,
  clearAllData
};
