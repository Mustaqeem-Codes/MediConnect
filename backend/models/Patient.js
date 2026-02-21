// backend/models/Patient.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Patient {
  // Create a new patient
  static async create(patientData) {
    const { name, email, phone, password, date_of_birth, location } = patientData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO patients (name, email, phone, password_hash, date_of_birth, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, date_of_birth, location, is_verified, is_blocked, created_at
    `;
    const values = [name, email, phone, password_hash, date_of_birth || null, location || null];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique violations
      if (error.code === '23505') {
        if (error.constraint === 'patients_email_key') {
          throw new Error('Email already registered');
        } else if (error.constraint === 'patients_phone_key') {
          throw new Error('Phone number already registered');
        }
      }
      throw error;
    }
  }

  // Find patient by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM patients WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find patient by phone
  static async findByPhone(phone) {
    const query = 'SELECT * FROM patients WHERE phone = $1';
    const result = await pool.query(query, [phone]);
    return result.rows[0];
  }

  // Find patient by ID
  static async findById(id) {
    const query = 'SELECT id, name, email, phone, date_of_birth, location, is_verified, is_blocked, created_at FROM patients WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update patient profile
  static async update(id, updateData) {
    const { name, phone, date_of_birth, location } = updateData;
    const query = `
      UPDATE patients
      SET name = $1,
          phone = $2,
          date_of_birth = $3,
          location = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, phone, date_of_birth, location, is_verified, is_blocked, created_at, updated_at
    `;
    const values = [name, phone, date_of_birth || null, location || null, id];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'patients_phone_key') {
          throw new Error('Phone number already registered');
        }
      }
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update verification status
  static async verifyEmail(id) {
    const query = 'UPDATE patients SET is_verified = true WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Patient;