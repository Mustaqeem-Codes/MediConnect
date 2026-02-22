// backend/models/Message.js
const { pool } = require('../config/database');

class Message {
  static async create({ appointment_id, sender_role, sender_id, body }) {
    const query = `
      INSERT INTO messages (appointment_id, sender_role, sender_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, appointment_id, sender_role, sender_id, body, created_at
    `;
    const values = [appointment_id, sender_role, sender_id, body];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByAppointment(appointment_id) {
    const query = `
      SELECT id, appointment_id, sender_role, sender_id, body, created_at
      FROM messages
      WHERE appointment_id = $1
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [appointment_id]);
    return result.rows;
  }

  static async countDoctorMessagesByAppointment(appointment_id) {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM messages
      WHERE appointment_id = $1 AND sender_role = 'doctor'
    `;
    const result = await pool.query(query, [appointment_id]);
    return result.rows[0]?.count || 0;
  }

  static async countPatientMessagesByAppointment(appointment_id) {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM messages
      WHERE appointment_id = $1 AND sender_role = 'patient'
    `;
    const result = await pool.query(query, [appointment_id]);
    return result.rows[0]?.count || 0;
  }
}

module.exports = Message;
