// backend/models/Appointment.js
const { pool } = require('../config/database');

class Appointment {
  static async create({
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
    consultation_type,
    appointment_type,
    duration_units
  }) {
    const query = `
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        consultation_type,
        appointment_type,
        duration_units
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                consultation_type, appointment_type, duration_units,
                status, reason, report_due_at, report_submitted_at, interaction_closed_at, created_at
    `;
    const values = [
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason || null,
      consultation_type || 'physical_checkup',
      appointment_type || null,
      Number.isInteger(duration_units) ? duration_units : 2
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByPatientId(patient_id) {
    const query = `
      SELECT a.id, a.global_sequence_id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time,
              a.consultation_type, a.appointment_type, a.duration_units, a.status, a.reason,
              a.treatment_summary, a.medical_report, a.medicines, a.prescriptions, a.recommendations,
              a.report_due_at, a.report_submitted_at, a.reminder_sent_at, a.interaction_closed_at,
             a.created_at,
             (pr.id IS NOT NULL) AS patient_review_submitted,
             d.name AS doctor_name, d.specialty AS doctor_specialty
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      LEFT JOIN reviews pr
        ON pr.appointment_id = a.id
       AND pr.reviewer_role = 'patient'
       AND pr.reviewer_id = a.patient_id
       AND pr.reviewee_role = 'doctor'
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows;
  }

  static async findByDoctorId(doctor_id) {
    const query = `
      SELECT a.id, a.global_sequence_id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time,
              a.consultation_type, a.appointment_type, a.duration_units, a.status, a.reason,
              a.treatment_summary, a.medical_report, a.medicines, a.prescriptions, a.recommendations,
              a.report_due_at, a.report_submitted_at, a.reminder_sent_at, a.interaction_closed_at,
              a.created_at,
             (dr.id IS NOT NULL) AS doctor_review_submitted,
             latest.id AS latest_record_appointment_id,
             latest.treatment_summary AS latest_treatment_summary,
             latest.medical_report AS latest_medical_report,
             latest.medicines AS latest_medicines,
             latest.prescriptions AS latest_prescriptions,
             latest.recommendations AS latest_recommendations,
             latest.report_submitted_at AS latest_report_submitted_at,
             p.name AS patient_name, p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN reviews dr
        ON dr.appointment_id = a.id
       AND dr.reviewer_role = 'doctor'
       AND dr.reviewer_id = a.doctor_id
       AND dr.reviewee_role = 'patient'
      LEFT JOIN LATERAL (
        SELECT ar.id, ar.treatment_summary, ar.medical_report, ar.medicines, ar.prescriptions, ar.recommendations, ar.report_submitted_at
        FROM appointments ar
        WHERE ar.patient_id = a.patient_id
          AND ar.report_submitted_at IS NOT NULL
        ORDER BY ar.report_submitted_at DESC
        LIMIT 1
      ) latest ON true
      WHERE a.doctor_id = $1
      ORDER BY CASE WHEN a.status IN ('pending', 'confirmed') THEN 0 ELSE 1 END,
               a.global_sequence_id ASC
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
              consultation_type, appointment_type, duration_units, status, reason,
              treatment_summary, medical_report, medicines, prescriptions, recommendations,
              report_due_at, report_submitted_at, reminder_sent_at, interaction_closed_at,
              created_at, updated_at
      FROM appointments
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async isDoctorBookable(doctor_id) {
    const query = `
      SELECT id
      FROM doctors
      WHERE id = $1
        AND is_verified = true
        AND is_approved = true
        AND is_blocked = false
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows.length > 0;
  }

  static async isSlotBooked({ doctor_id, appointment_date, appointment_time }) {
    const query = `
      SELECT id
      FROM appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND appointment_time = $3
        AND status IN ('pending', 'confirmed')
      LIMIT 1
    `;
    const result = await pool.query(query, [doctor_id, appointment_date, appointment_time]);
    return result.rows.length > 0;
  }

  static async getBookedUnitsByHour({ doctor_id, appointment_date }) {
    const query = `
      SELECT EXTRACT(HOUR FROM appointment_time)::int AS hour,
             COALESCE(SUM(duration_units), 0)::int AS units
      FROM appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND status IN ('pending', 'confirmed')
      GROUP BY EXTRACT(HOUR FROM appointment_time)
    `;
    const result = await pool.query(query, [doctor_id, appointment_date]);
    const usage = new Map();
    for (const row of result.rows) {
      usage.set(row.hour, row.units);
    }
    return usage;
  }

  static async isHourCapacityAvailable({ doctor_id, appointment_date, appointment_time, required_units, capacity_units = 6 }) {
    const hour = Number(String(appointment_time).slice(0, 2));
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;

    const usage = await Appointment.getBookedUnitsByHour({ doctor_id, appointment_date });
    const usedUnits = usage.get(hour) || 0;
    const remainingUnits = capacity_units - usedUnits;
    return remainingUnits >= required_units;
  }

  static async getBookedSlots({ doctor_id, appointment_date }) {
    const query = `
      SELECT appointment_time
      FROM appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND status IN ('pending', 'confirmed')
      ORDER BY appointment_time ASC
    `;
    const result = await pool.query(query, [doctor_id, appointment_date]);
    return result.rows.map((row) => row.appointment_time);
  }

  static async updateStatus({ id, doctor_id, status }) {
    const query = `
      UPDATE appointments
      SET status = $1,
          report_due_at = CASE
            WHEN $1 = 'completed' AND report_due_at IS NULL
            THEN (appointment_date::timestamp + appointment_time + INTERVAL '24 hours')
            ELSE report_due_at
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND doctor_id = $3
      RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                consultation_type, appointment_type, duration_units,
                status, reason, report_due_at, report_submitted_at,
                reminder_sent_at, interaction_closed_at, updated_at
    `;
    const result = await pool.query(query, [status, id, doctor_id]);
    return result.rows[0];
  }

  static async submitDoctorReport({
    id,
    doctor_id,
    treatment_summary,
    medical_report,
    medicines,
    prescriptions,
    recommendations
  }) {
    const query = `
      UPDATE appointments
      SET treatment_summary = $1,
          medical_report = $2,
          medicines = $3::jsonb,
          prescriptions = $4,
          recommendations = $5,
          report_submitted_at = CURRENT_TIMESTAMP,
          interaction_closed_at = CURRENT_TIMESTAMP,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND doctor_id = $7
      RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                consultation_type, appointment_type, duration_units,
                status, reason,
                treatment_summary, medical_report, medicines, prescriptions, recommendations,
                report_due_at, report_submitted_at, reminder_sent_at, interaction_closed_at, updated_at
    `;
    const values = [
      treatment_summary,
      medical_report,
      JSON.stringify(Array.isArray(medicines) ? medicines : []),
      prescriptions || null,
      recommendations || null,
      id,
      doctor_id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findReportPendingPastDue() {
    const query = `
      SELECT id, patient_id, doctor_id, appointment_date, appointment_time, consultation_type, status, report_due_at
      FROM appointments
      WHERE consultation_type IN ('physical_checkup', 'video_consultation')
        AND status = 'completed'
        AND report_submitted_at IS NULL
        AND interaction_closed_at IS NULL
        AND report_due_at IS NOT NULL
        AND report_due_at <= CURRENT_TIMESTAMP
        AND reminder_sent_at IS NULL
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async markReminderSent(id) {
    const query = `
      UPDATE appointments
      SET reminder_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, reminder_sent_at
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findLatestRecordByPatientId(patient_id) {
    const query = `
      SELECT id, patient_id, doctor_id, appointment_date, appointment_time,
             treatment_summary, medical_report, medicines, prescriptions, recommendations, report_submitted_at
      FROM appointments
      WHERE patient_id = $1
        AND report_submitted_at IS NOT NULL
      ORDER BY report_submitted_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows[0];
  }

  static async findRecordHistoryByPatientId(patient_id) {
    const query = `
      SELECT id, patient_id, doctor_id, appointment_date, appointment_time,
             treatment_summary, medical_report, medicines, prescriptions, recommendations, report_submitted_at
      FROM appointments
      WHERE patient_id = $1
        AND report_submitted_at IS NOT NULL
      ORDER BY report_submitted_at DESC
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows;
  }
}

module.exports = Appointment;
