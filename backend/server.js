// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, initDB } = require('./config/database');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

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
      'POST /api/doctors/register',
      'POST /api/doctors/login',
      'GET /api/doctors/profile',
      'POST /api/appointments',
      'GET /api/appointments/patient',
      'GET /api/appointments/doctor',
      'PUT /api/appointments/:id/status'
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

const startServer = async () => {
  // Initialize database
  dbConnected = await initDB();
  
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