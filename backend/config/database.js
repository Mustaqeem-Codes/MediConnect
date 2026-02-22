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
    // Sequences (used for global FIFO ordering)
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS appointments_global_sequence START 1;`);

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
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Patients table ready');

    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS location TEXT');
  await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE');

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
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Doctors table ready');

    await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS location TEXT');
  await pool.query('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE');
    await pool.query("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability_mode VARCHAR(20) DEFAULT 'custom'");
    await pool.query("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability_slots JSONB DEFAULT '[]'::jsonb");

    // Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        global_sequence_id BIGINT NOT NULL DEFAULT nextval('appointments_global_sequence'),
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        consultation_type VARCHAR(40) DEFAULT 'physical_checkup',
        appointment_type VARCHAR(40) DEFAULT NULL,
        duration_units INTEGER NOT NULL DEFAULT 2,
        video_room_id TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reason TEXT,
        treatment_summary TEXT,
        medical_report TEXT,
        medicines JSONB DEFAULT '[]'::jsonb,
        prescriptions TEXT,
        recommendations TEXT,
        report_due_at TIMESTAMP,
        report_submitted_at TIMESTAMP,
        reminder_sent_at TIMESTAMP,
        interaction_closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Appointments table ready');

    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(40) DEFAULT 'physical_checkup'");
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS global_sequence_id BIGINT");
    await pool.query(
      "ALTER TABLE appointments ALTER COLUMN global_sequence_id SET DEFAULT nextval('appointments_global_sequence')"
    );
    await pool.query(
      "UPDATE appointments SET global_sequence_id = nextval('appointments_global_sequence') WHERE global_sequence_id IS NULL"
    );
    await pool.query('ALTER TABLE appointments ALTER COLUMN global_sequence_id SET NOT NULL');

    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(40)");
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_units INTEGER');
    await pool.query('UPDATE appointments SET duration_units = 2 WHERE duration_units IS NULL');
    await pool.query('ALTER TABLE appointments ALTER COLUMN duration_units SET NOT NULL');
    await pool.query('ALTER TABLE appointments ALTER COLUMN duration_units SET DEFAULT 2');

    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS treatment_summary TEXT');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medical_report TEXT');
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb");
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS prescriptions TEXT');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recommendations TEXT');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_room_id TEXT');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS report_due_at TIMESTAMP');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS report_submitted_at TIMESTAMP');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP');
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS interaction_closed_at TIMESTAMP');
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");

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

    // Medical record access requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_record_access_requests (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decided_at TIMESTAMP,
        UNIQUE (appointment_id, doctor_id)
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_record_access_patient_id ON medical_record_access_requests(patient_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_record_access_doctor_id ON medical_record_access_requests(doctor_id)');
    console.log('✅ Medical record access requests table ready');

    // Reviews table (patient<->doctor and software)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        reviewer_role VARCHAR(20) NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewee_role VARCHAR(20) NOT NULL,
        reviewee_id INTEGER,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (appointment_id, reviewer_role, reviewer_id, reviewee_role)
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON reviews(appointment_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_role, reviewee_id)');
    console.log('✅ Reviews table ready');

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id)');
    console.log('✅ Notifications table ready');

    // Helpful indexes for unit-based availability checks
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time ON appointments(doctor_id, appointment_date, appointment_time)'
    );

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