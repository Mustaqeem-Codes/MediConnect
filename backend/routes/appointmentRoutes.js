// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAppointment,
  getDoctorAvailableSlots,
  triageAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  submitAppointmentReport,
  getLatestPatientRecord,
  requestFullPatientRecordAccess,
  getFullPatientRecord
} = require('../controllers/appointmentController');

// @route   GET /api/appointments/doctor/:doctorId/slots?date=YYYY-MM-DD
// @desc    Get doctor available slots for a specific date
// @access  Public
router.get('/doctor/:doctorId/slots', getDoctorAvailableSlots);

// @route   POST /api/appointments/triage
// @desc    Estimate appointment duration units from symptoms
// @access  Public
router.post('/triage', triageAppointment);

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

// @route   PUT /api/appointments/:id/report
// @desc    Submit treatment/report for appointment
// @access  Private (doctor)
router.put('/:id/report', protect, authorize('doctor'), submitAppointmentReport);

// @route   GET /api/appointments/:id/patient-record/latest
// @desc    Get latest patient record (doctor in accepted appointment)
// @access  Private (doctor)
router.get('/:id/patient-record/latest', protect, authorize('doctor'), getLatestPatientRecord);

// @route   POST /api/appointments/:id/patient-record/request-access
// @desc    Request full patient record access
// @access  Private (doctor)
router.post('/:id/patient-record/request-access', protect, authorize('doctor'), requestFullPatientRecordAccess);

// @route   GET /api/appointments/:id/patient-record/full
// @desc    Get full patient record history (if access approved)
// @access  Private (doctor)
router.get('/:id/patient-record/full', protect, authorize('doctor'), getFullPatientRecord);

module.exports = router;
