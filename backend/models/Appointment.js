// backend/models/Appointment.js
const { pool } = require('../config/database');

// Constants for Clinical Load Units
const HOUR_CAPACITY_UNITS = 6; // 6 units per hour = 60 minutes
const UNIT_MINUTES = 10; // 1 unit = 10 minutes
const ADDENDUM_WINDOW_HOURS = 2; // 2-hour window before report locks
const MIN_OVERLAP_SECONDS = 180; // 3 minutes minimum for valid encounter

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
    // Calculate hour_sequence_id (FCFS queue position within the hour)
    const hour = String(appointment_time).slice(0, 2);
    const seqQuery = `
      SELECT COALESCE(MAX(hour_sequence_id), 0) + 1 AS next_seq
      FROM appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND EXTRACT(HOUR FROM appointment_time) = $3
        AND status IN ('pending', 'confirmed')
    `;
    const seqResult = await pool.query(seqQuery, [doctor_id, appointment_date, parseInt(hour, 10)]);
    const hourSequenceId = seqResult.rows[0]?.next_seq || 1;

    const query = `
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        consultation_type,
        appointment_type,
        duration_units,
        hour_sequence_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                consultation_type, appointment_type, duration_units, hour_sequence_id, video_room_id,
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
      Number.isInteger(duration_units) ? duration_units : 2,
      hourSequenceId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByPatientId(patient_id) {
    const query = `
      SELECT a.id, a.global_sequence_id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time,
              a.consultation_type, a.appointment_type, a.duration_units, a.hour_sequence_id,
              a.video_room_id, a.status, a.reason,
              a.treatment_summary, a.medical_report, a.medicines, a.prescriptions, a.recommendations,
              a.diagnosis, a.medication_array, a.clinical_findings, a.patient_instructions,
              a.report_due_at, a.report_submitted_at, a.reminder_sent_at, a.interaction_closed_at,
              a.dispute_raised_at, a.dispute_raised_by, a.dispute_resolved_at, a.dispute_resolution,
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
              a.consultation_type, a.appointment_type, a.duration_units, a.hour_sequence_id,
              a.video_room_id, a.status, a.reason,
              a.treatment_summary, a.medical_report, a.medicines, a.prescriptions, a.recommendations,
              a.diagnosis, a.medication_array, a.clinical_findings, a.patient_instructions,
              a.report_due_at, a.report_submitted_at, a.report_locked_at, a.reminder_sent_at, a.interaction_closed_at,
              a.provider_join_time, a.patient_join_time, a.overlap_duration_seconds,
              a.dispute_raised_at, a.dispute_raised_by, a.dispute_resolved_at, a.dispute_resolution,
              a.created_at,
             (dr.id IS NOT NULL) AS doctor_review_submitted,
             p.name AS patient_name, p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN reviews dr
        ON dr.appointment_id = a.id
       AND dr.reviewer_role = 'doctor'
       AND dr.reviewer_id = a.doctor_id
       AND dr.reviewee_role = 'patient'
      WHERE a.doctor_id = $1
      ORDER BY CASE WHEN a.status IN ('pending', 'confirmed') THEN 0 ELSE 1 END,
               a.global_sequence_id ASC
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows;
  }

  // Get full medical history for a patient (for doctor view during appointment)
  static async getPatientMedicalHistory(patient_id) {
    const query = `
      SELECT a.id, a.appointment_date, a.appointment_time, a.consultation_type,
             a.diagnosis, a.medication_array, a.treatment_summary, a.medical_report,
             a.clinical_findings, a.patient_instructions, a.medicines, a.prescriptions, a.recommendations,
             a.report_submitted_at,
             d.name AS doctor_name, d.specialty AS doctor_specialty
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.patient_id = $1
        AND a.report_submitted_at IS NOT NULL
        AND a.status = 'completed'
      ORDER BY a.report_submitted_at DESC
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
              consultation_type, appointment_type, duration_units, hour_sequence_id,
              video_room_id, status, reason,
              treatment_summary, medical_report, medicines, prescriptions, recommendations,
              diagnosis, medication_array, clinical_findings, patient_instructions,
              report_due_at, report_submitted_at, report_locked_at, reminder_sent_at, interaction_closed_at,
              provider_join_time, patient_join_time, overlap_duration_seconds, video_audit_log,
              dispute_raised_at, dispute_raised_by, dispute_resolved_at, dispute_resolution,
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
    console.log('[Appointment.updateStatus] Starting with params:', { id, doctor_id, status });
    
    // Ensure IDs are integers
    const appointmentId = parseInt(id, 10);
    const doctorIdInt = parseInt(doctor_id, 10);
    
    if (isNaN(appointmentId) || isNaN(doctorIdInt)) {
      console.log('[Appointment.updateStatus] Invalid ID format:', { id, doctor_id });
      return null;
    }
    
    try {
      // First verify the appointment exists
      const checkQuery = `SELECT id, doctor_id, status, consultation_type FROM appointments WHERE id = $1::int`;
      const checkResult = await pool.query(checkQuery, [appointmentId]);
      console.log('[Appointment.updateStatus] Existing appointment:', checkResult.rows[0]);

      if (!checkResult.rows[0]) {
        console.log('[Appointment.updateStatus] No appointment found with id:', id);
        return null;
      }

      if (checkResult.rows[0].doctor_id !== doctorIdInt) {
        console.log('[Appointment.updateStatus] Doctor ID mismatch:', {
          appointmentDoctorId: checkResult.rows[0].doctor_id,
          requestingDoctorId: doctorIdInt
        });
        return null;
      }

      const query = `
        UPDATE appointments
        SET status = $1::varchar,
            video_room_id = CASE
              WHEN $1::varchar = 'confirmed'
                AND consultation_type = 'video_consultation'
                AND (video_room_id IS NULL OR video_room_id = '')
              THEN CONCAT('mc-', id::text, '-', SUBSTR(MD5(RANDOM()::text), 1, 10))
              ELSE video_room_id
            END,
            report_due_at = CASE
              WHEN $1::varchar = 'completed' AND report_due_at IS NULL
              THEN (appointment_date::timestamp + appointment_time + INTERVAL '24 hours')
              ELSE report_due_at
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::int AND doctor_id = $3::int
        RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                  consultation_type, appointment_type, duration_units, video_room_id,
                  status, reason, report_due_at, report_submitted_at,
                  reminder_sent_at, interaction_closed_at, updated_at
      `;
      
      console.log('[Appointment.updateStatus] Executing update query');
      const result = await pool.query(query, [status, appointmentId, doctorIdInt]);
      console.log('[Appointment.updateStatus] Query result rows:', result.rows.length);
      
      return result.rows[0];
    } catch (error) {
      console.error('[Appointment.updateStatus] Database error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
        stack: error.stack
      });
      throw error;
    }
  }

  static async submitDoctorReport({
    id,
    doctor_id,
    treatment_summary,
    medical_report,
    medicines,
    prescriptions,
    recommendations,
    diagnosis,
    medication_array,
    clinical_findings,
    patient_instructions
  }) {
    // Check if report is already locked
    const lockCheck = await pool.query(
      `SELECT report_locked_at FROM appointments WHERE id = $1 AND doctor_id = $2`,
      [id, doctor_id]
    );
    if (lockCheck.rows[0]?.report_locked_at) {
      throw new Error('Report is locked and cannot be modified');
    }

    const query = `
      UPDATE appointments
      SET treatment_summary = $1,
          medical_report = $2,
          medicines = $3::jsonb,
          prescriptions = $4,
          recommendations = $5,
          diagnosis = $6::jsonb,
          medication_array = $7::jsonb,
          clinical_findings = $8,
          patient_instructions = $9,
          report_submitted_at = COALESCE(report_submitted_at, CURRENT_TIMESTAMP),
          report_locked_at = CASE 
            WHEN report_submitted_at IS NOT NULL 
              AND report_submitted_at + INTERVAL '${ADDENDUM_WINDOW_HOURS} hours' <= CURRENT_TIMESTAMP
            THEN CURRENT_TIMESTAMP
            ELSE report_locked_at
          END,
          interaction_closed_at = CURRENT_TIMESTAMP,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND doctor_id = $11
      RETURNING id, global_sequence_id, patient_id, doctor_id, appointment_date, appointment_time,
                consultation_type, appointment_type, duration_units, video_room_id,
                status, reason,
                treatment_summary, medical_report, medicines, prescriptions, recommendations,
                diagnosis, medication_array, clinical_findings, patient_instructions,
                report_due_at, report_submitted_at, report_locked_at, reminder_sent_at, interaction_closed_at, updated_at
    `;
    const values = [
      treatment_summary,
      medical_report,
      JSON.stringify(Array.isArray(medicines) ? medicines : []),
      prescriptions || null,
      recommendations || null,
      JSON.stringify(Array.isArray(diagnosis) ? diagnosis : []),
      JSON.stringify(Array.isArray(medication_array) ? medication_array : []),
      clinical_findings || null,
      patient_instructions || null,
      id,
      doctor_id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Check and lock reports past addendum window
  static async lockExpiredReports() {
    const query = `
      UPDATE appointments
      SET report_locked_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE report_submitted_at IS NOT NULL
        AND report_locked_at IS NULL
        AND report_submitted_at + INTERVAL '${ADDENDUM_WINDOW_HOURS} hours' <= CURRENT_TIMESTAMP
      RETURNING id
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // =============== Video Audit Trail Methods ===============

  static async recordVideoJoin({ id, role, user_id }) {
    const column = role === 'doctor' ? 'provider_join_time' : 'patient_join_time';
    const query = `
      UPDATE appointments
      SET ${column} = COALESCE(${column}, CURRENT_TIMESTAMP),
          video_audit_log = video_audit_log || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, provider_join_time, patient_join_time, video_audit_log
    `;
    const logEntry = JSON.stringify([{
      event: 'join',
      role,
      user_id,
      timestamp: new Date().toISOString()
    }]);
    const result = await pool.query(query, [logEntry, id]);
    return result.rows[0];
  }

  static async recordVideoLeave({ id, role, user_id }) {
    const query = `
      UPDATE appointments
      SET video_audit_log = video_audit_log || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, video_audit_log
    `;
    const logEntry = JSON.stringify([{
      event: 'leave',
      role,
      user_id,
      timestamp: new Date().toISOString()
    }]);
    const result = await pool.query(query, [logEntry, id]);
    return result.rows[0];
  }

  static async calculateOverlapDuration(id) {
    const query = `
      UPDATE appointments
      SET overlap_duration_seconds = CASE
            WHEN provider_join_time IS NOT NULL AND patient_join_time IS NOT NULL
            THEN GREATEST(0, EXTRACT(EPOCH FROM (
              LEAST(CURRENT_TIMESTAMP, interaction_closed_at, CURRENT_TIMESTAMP) - 
              GREATEST(provider_join_time, patient_join_time)
            ))::int)
            ELSE 0
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, overlap_duration_seconds, provider_join_time, patient_join_time
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // =============== Professional Status & Dispute Logic ===============

  static async raiseDispute({ id, raised_by, reason }) {
    const query = `
      UPDATE appointments
      SET status = 'disputed',
          dispute_raised_at = CURRENT_TIMESTAMP,
          dispute_raised_by = $1::varchar,
          video_audit_log = video_audit_log || $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
        AND status IN ('confirmed', 'completed')
      RETURNING id, status, dispute_raised_at, dispute_raised_by
    `;
    const logEntry = JSON.stringify([{
      event: 'dispute_raised',
      raised_by,
      reason,
      timestamp: new Date().toISOString()
    }]);
    const result = await pool.query(query, [raised_by, logEntry, id]);
    return result.rows[0];
  }

  static async resolveDispute({ id, resolution, resolved_by }) {
    const newStatus = resolution === 'provider_favor' ? 'completed' : 
                      resolution === 'patient_favor' ? 'cancelled' : 'completed';
    const query = `
      UPDATE appointments
      SET status = $1::varchar,
          dispute_resolved_at = CURRENT_TIMESTAMP,
          dispute_resolution = $2::varchar,
          video_audit_log = video_audit_log || $3::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
        AND status = 'disputed'
      RETURNING id, status, dispute_resolved_at, dispute_resolution
    `;
    const logEntry = JSON.stringify([{
      event: 'dispute_resolved',
      resolution,
      resolved_by,
      timestamp: new Date().toISOString()
    }]);
    const result = await pool.query(query, [newStatus, resolution, logEntry, id]);
    return result.rows[0];
  }

  static async markNoShow({ id, no_show_party }) {
    // Check if either party never joined within 15 minutes
    const query = `
      UPDATE appointments
      SET status = 'no_show',
          video_audit_log = video_audit_log || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND status = 'confirmed'
        AND (
          (provider_join_time IS NULL AND $3 = 'provider')
          OR (patient_join_time IS NULL AND $3 = 'patient')
        )
      RETURNING id, status
    `;
    const logEntry = JSON.stringify([{
      event: 'no_show',
      party: no_show_party,
      timestamp: new Date().toISOString()
    }]);
    const result = await pool.query(query, [logEntry, id, no_show_party]);
    return result.rows[0];
  }

  // Validate completion eligibility (report submitted + valid overlap)
  static async canMarkCompleted(id) {
    const query = `
      SELECT id, 
             report_submitted_at IS NOT NULL AS has_report,
             overlap_duration_seconds >= ${MIN_OVERLAP_SECONDS} AS has_valid_overlap,
             consultation_type
      FROM appointments
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    const row = result.rows[0];
    if (!row) return { eligible: false, reason: 'Appointment not found' };
    
    // Physical checkups don't need video overlap
    if (row.consultation_type === 'physical_checkup') {
      return { eligible: row.has_report, reason: row.has_report ? null : 'Report not submitted' };
    }
    
    // Video consultations need both report and valid overlap
    if (!row.has_report) return { eligible: false, reason: 'Report not submitted' };
    if (!row.has_valid_overlap) return { eligible: false, reason: 'Insufficient video overlap (min 3 minutes required)' };
    return { eligible: true, reason: null };
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
