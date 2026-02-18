// backend/models/Appointment.js
const { pool } = require('../config/database');

class Appointment {
  static async create({ patient_id, doctor_id, appointment_date, appointment_time, reason }) {
    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_at
    `;
    const values = [patient_id, doctor_id, appointment_date, appointment_time, reason || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByPatientId(patient_id) {
    const query = `
      SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time,
             a.status, a.reason, a.created_at,
             d.name AS doctor_name, d.specialty AS doctor_specialty
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows;
  }

  static async findByDoctorId(doctor_id) {
    const query = `
      SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time,
             a.status, a.reason, a.created_at,
             p.name AS patient_name, p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows;
  }

  static async updateStatus({ id, status }) {
    const query = `
      UPDATE appointments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, updated_at
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = Appointment;
