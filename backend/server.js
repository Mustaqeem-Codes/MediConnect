// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env in backend folder
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { pool, initDB } = require('./config/database');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { processPendingReportReminders } = require('./services/reportReminderService');

// dotenv already loaded above

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) => /^(http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/i.test(origin);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const originMatchesPattern = (origin, pattern) => {
  if (!pattern) return false;
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;

  const regexSource = `^${pattern.split('*').map(escapeRegex).join('.*')}$`;
  try {
    const regex = new RegExp(regexSource, 'i');
    return regex.test(origin);
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (isLocalDevOrigin(origin)) return true;
  return allowedOrigins.some((pattern) => originMatchesPattern(origin, pattern));
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    }
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Initialize database connection
let dbConnected = false;

// Test route with DB status
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 Medi Online Clinic API',
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API health check with detailed status
app.get('/api/health', async (req, res) => {
  try {
    // Test database with simple query
    const dbTest = dbConnected ? await pool.query('SELECT NOW() as time') : null;
    
    res.json({ 
      status: 'healthy',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        timestamp: dbTest?.rows[0]?.time || null
      },
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.json({ 
      status: 'degraded',
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/patients/register',
      'POST /api/patients/login',
      'GET /api/patients/profile',
      'GET /api/patients/record-access-requests',
      'PUT /api/patients/record-access-requests/:id',
      'POST /api/doctors/register',
      'POST /api/doctors/login',
      'GET /api/doctors/profile',
      'GET /api/doctors/notifications',
      'PUT /api/doctors/notifications/:id/read',
      'POST /api/admin/login',
      'GET /api/admin/overview',
      'GET /api/admin/doctors',
      'GET /api/admin/patients',
      'PUT /api/admin/doctors/:id/verify',
      'PUT /api/admin/doctors/:id/block',
      'PUT /api/admin/patients/:id/block',
      'POST /api/appointments',
      'GET /api/appointments/patient',
      'GET /api/appointments/doctor',
      'PUT /api/appointments/:id/status',
      'PUT /api/appointments/:id/report',
      'GET /api/appointments/:id/patient-record/latest',
      'POST /api/appointments/:id/patient-record/request-access',
      'GET /api/appointments/:id/patient-record/full',
      'GET /api/messages/appointments/:appointmentId',
      'POST /api/messages/appointments/:appointmentId',
      'POST /api/reviews/appointments/:appointmentId/doctor',
      'POST /api/reviews/appointments/:appointmentId/patient',
      'POST /api/reviews/software',
      'GET /api/reviews/doctors/:doctorId/summary',
      'GET /api/reviews/software/summary'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server with database initialization
const PORT = process.env.PORT || 5000;
const REPORT_REMINDER_INTERVAL_MS = 60 * 60 * 1000;

const startServer = async () => {
  // Initialize database
  dbConnected = await initDB();

  if (dbConnected) {
    try {
      const count = await processPendingReportReminders();
      if (count > 0) {
        console.log(`📣 Report reminder notifications sent: ${count}`);
      }
    } catch (error) {
      console.error('❌ Initial report reminder job failed:', error.message);
    }

    setInterval(async () => {
      try {
        const count = await processPendingReportReminders();
        if (count > 0) {
          console.log(`📣 Report reminder notifications sent: ${count}`);
        }
      } catch (error) {
        console.error('❌ Scheduled report reminder job failed:', error.message);
      }
    }, REPORT_REMINDER_INTERVAL_MS);
  }
  
  // Start listening
  app.listen(PORT, () => {
    console.log(`
  🚀 Server is running!
  📡 Port: ${PORT}
  🔗 http://localhost:${PORT}
  📊 Health: http://localhost:${PORT}/api/health
  💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}
    `);
  });
};

startServer();