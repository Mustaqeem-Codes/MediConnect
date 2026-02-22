const { pool } = require('../config/database');

class Review {
  static async create({ appointment_id, reviewer_role, reviewer_id, reviewee_role, reviewee_id, rating, review_text }) {
    const query = `
      INSERT INTO reviews (appointment_id, reviewer_role, reviewer_id, reviewee_role, reviewee_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, appointment_id, reviewer_role, reviewer_id, reviewee_role, reviewee_id, rating, review_text, created_at
    `;
    const values = [
      appointment_id || null,
      reviewer_role,
      reviewer_id,
      reviewee_role,
      reviewee_id || null,
      rating,
      review_text || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async existsForAppointment({ appointment_id, reviewer_role, reviewer_id, reviewee_role }) {
    const query = `
      SELECT id
      FROM reviews
      WHERE appointment_id = $1
        AND reviewer_role = $2
        AND reviewer_id = $3
        AND reviewee_role = $4
      LIMIT 1
    `;
    const result = await pool.query(query, [appointment_id, reviewer_role, reviewer_id, reviewee_role]);
    return result.rows.length > 0;
  }

  static async hasPendingMandatoryDoctorReviewByPatient(patient_id) {
    const query = `
      SELECT a.id
      FROM appointments a
      LEFT JOIN reviews r
        ON r.appointment_id = a.id
       AND r.reviewer_role = 'patient'
       AND r.reviewer_id = $1
       AND r.reviewee_role = 'doctor'
      WHERE a.patient_id = $1
        AND a.report_submitted_at IS NOT NULL
        AND a.interaction_closed_at IS NOT NULL
        AND r.id IS NULL
      ORDER BY a.report_submitted_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [patient_id]);
    return result.rows.length > 0;
  }

  static async getDoctorRatingSummary(doctor_id) {
    const query = `
      SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average_rating,
             COUNT(*)::int AS total_reviews
      FROM reviews
      WHERE reviewee_role = 'doctor' AND reviewee_id = $1
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows[0] || { average_rating: 0, total_reviews: 0 };
  }

  static async getSoftwareRatingSummary() {
    const query = `
      SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average_rating,
             COUNT(*)::int AS total_reviews
      FROM reviews
      WHERE reviewee_role = 'software'
    `;
    const result = await pool.query(query);
    return result.rows[0] || { average_rating: 0, total_reviews: 0 };
  }
}

module.exports = Review;
