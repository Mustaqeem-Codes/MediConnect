const { pool } = require('../config/database');

class Notification {
  static async createDoctorReminder({ doctor_id, appointment_id, title, body }) {
    const query = `
      INSERT INTO notifications (doctor_id, appointment_id, title, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, doctor_id, appointment_id, title, body, is_read, created_at
    `;
    const values = [doctor_id, appointment_id || null, title, body];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByDoctorId(doctor_id) {
    const query = `
      SELECT id, doctor_id, appointment_id, title, body, is_read, created_at
      FROM notifications
      WHERE doctor_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [doctor_id]);
    return result.rows;
  }

  static async markAsRead({ id, doctor_id }) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND doctor_id = $2
      RETURNING id, doctor_id, appointment_id, title, body, is_read, created_at
    `;
    const result = await pool.query(query, [id, doctor_id]);
    return result.rows[0];
  }
}

module.exports = Notification;
