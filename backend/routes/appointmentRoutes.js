// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');

// @route   POST /api/appointments
// @desc    Create appointment
// @access  Private (patient)
router.post('/', protect, authorize('patient'), createAppointment);

// @route   GET /api/appointments/patient
// @desc    Get appointments for current patient
// @access  Private (patient)
router.get('/patient', protect, authorize('patient'), getPatientAppointments);

// @route   GET /api/appointments/doctor
// @desc    Get appointments for current doctor
// @access  Private (doctor)
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (doctor)
router.put('/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

module.exports = router;
