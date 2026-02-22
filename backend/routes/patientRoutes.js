// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerPatient,
  loginPatient,
  getProfile,
  updateProfile,
  getRecordAccessRequests,
  decideRecordAccessRequest
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

// @route   GET /api/patients/record-access-requests
// @desc    Get pending full-record access requests for current patient
// @access  Private (patient)
router.get('/record-access-requests', protect, getRecordAccessRequests);

// @route   PUT /api/patients/record-access-requests/:id
// @desc    Approve or deny full-record access request
// @access  Private (patient)
router.put('/record-access-requests/:id', protect, decideRecordAccessRequest);

module.exports = router;
