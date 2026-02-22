const { pool } = require('../config/database');

class MedicalRecordAccessRequest {
  static async create({ appointment_id, patient_id, doctor_id, reason }) {
    const query = `
      INSERT INTO medical_record_access_requests (appointment_id, patient_id, doctor_id, reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (appointment_id, doctor_id)
      DO UPDATE SET reason = EXCLUDED.reason, status = 'pending', requested_at = CURRENT_TIMESTAMP, decided_at = NULL
      RETURNING id, appointment_id, patient_id, doctor_id, reason, status, requested_at, decided_at
    `;
    const values = [appointment_id, patient_id, doctor_id, reason || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findPendingByPatientId(patient_id) {
    const query = `
      SELECT r.id, r.appointment_id, r.patient_id, r.doctor_id, r.reason, r.status, r.requested_at,
             d.name AS doctor_name
      FROM medical_record_access_requests r
      JOIN doctors d ON d.id = r.doctor_id
      WHERE r.patient_id = $1 AND r.status = 'pending'
      ORDER BY r.requested_at DESC
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows;
  }

  static async decide({ id, patient_id, status }) {
    const query = `
      UPDATE medical_record_access_requests
      SET status = $1,
          decided_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND patient_id = $3 AND status = 'pending'
      RETURNING id, appointment_id, patient_id, doctor_id, reason, status, requested_at, decided_at
    `;
    const result = await pool.query(query, [status, id, patient_id]);
    return result.rows[0];
  }

  static async hasApprovedAccess({ patient_id, doctor_id }) {
    const query = `
      SELECT id
      FROM medical_record_access_requests
      WHERE patient_id = $1
        AND doctor_id = $2
        AND status = 'approved'
      ORDER BY decided_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [patient_id, doctor_id]);
    return result.rows.length > 0;
  }
}

module.exports = MedicalRecordAccessRequest;
