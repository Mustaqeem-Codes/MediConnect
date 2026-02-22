// backend/routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerDoctor,
  loginDoctor,
  getProfile,
  listDoctors,
  getDoctorById,
  updateAvailability,
  getDoctorNotifications,
  markNotificationRead
} = require('../controllers/doctorController');

// @route   POST /api/doctors/register
// @desc    Register a new doctor
// @access  Public
router.post('/register', registerDoctor);

// @route   GET /api/doctors
// @desc    List doctors
// @access  Public
router.get('/', listDoctors);

// @route   POST /api/doctors/login
// @desc    Login doctor
// @access  Public
router.post('/login', loginDoctor);

// @route   GET /api/doctors/profile
// @desc    Get current doctor profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/doctors/availability
// @desc    Update current doctor's availability
// @access  Private (doctor)
router.put('/availability', protect, authorize('doctor'), updateAvailability);

// @route   GET /api/doctors/notifications
// @desc    Get current doctor's notifications
// @access  Private (doctor)
router.get('/notifications', protect, authorize('doctor'), getDoctorNotifications);

// @route   PUT /api/doctors/notifications/:id/read
// @desc    Mark doctor notification as read
// @access  Private (doctor)
router.put('/notifications/:id/read', protect, authorize('doctor'), markNotificationRead);

// @route   GET /api/doctors/:id
// @desc    Get doctor details (public verified doctors only)
// @access  Public
router.get('/:id', getDoctorById);

module.exports = router;
