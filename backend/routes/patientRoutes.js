// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerPatient,
  loginPatient,
  getProfile,
  updateProfile
} = require('../controllers/patientController');

// @route   POST /api/patients/register
// @desc    Register a new patient
// @access  Public
router.post('/register', registerPatient);

// @route   POST /api/patients/login
// @desc    Login patient
// @access  Public
router.post('/login', loginPatient);

// @route   GET /api/patients/profile
// @desc    Get current patient profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/patients/profile
// @desc    Update current patient profile
// @access  Private
router.put('/profile', protect, updateProfile);

module.exports = router;
