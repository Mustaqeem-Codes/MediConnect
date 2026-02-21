// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool (support Heroku DATABASE_URL or local env vars)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Create tables if they don't exist
const createTables = async () => {
  try {
    // Patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        location TEXT,
        date_of_birth DATE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Patients table ready');

    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS location TEXT');

    // Doctors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        license_number VARCHAR(100) UNIQUE NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        location TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Doctors table ready');

    await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS location TEXT');

    // Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Appointments table ready');

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL,
        sender_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id)');
    console.log('✅ Messages table ready');

    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    return false;
  }
};

// Initialize database
const initDB = async () => {
  const connected = await testConnection();
  if (connected) {
    await createTables();
  }
  return connected;
};

module.exports = { pool, initDB };