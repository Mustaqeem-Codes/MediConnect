// backend/controllers/patientController.js
const Patient = require('../models/Patient');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new patient
// @route   POST /api/patients/register
// @access  Public
const registerPatient = async (req, res) => {
  try {
    const { name, email, phone, password, date_of_birth, location } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide name, email, phone, password, and location' 
      });
    }

    // Check if patient already exists
    const existingEmail = await Patient.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    const existingPhone = await Patient.findByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number already registered' 
      });
    }

    // Create patient
    const patient = await Patient.create({
      name,
      email,
      phone,
      password,
      date_of_birth,
      location
    });

    // Generate token
    const token = generateToken(patient.id);

    res.status(201).json({
      success: true,
      data: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        location: patient.location,
        is_verified: patient.is_verified,
        is_blocked: patient.is_blocked,
        role: 'patient',
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during registration' 
    });
  }
};

// @desc    Login patient
// @route   POST /api/patients/login
// @access  Public
const loginPatient = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Must have either email or phone, and password
    if ((!email && !phone) || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide email/phone and password' 
      });
    }

    // Find patient by email or phone
    let patient;
    if (email) {
      patient = await Patient.findByEmail(email);
    } else if (phone) {
      patient = await Patient.findByPhone(phone);
    }

    if (!patient) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    if (patient.is_blocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account is blocked'
      });
    }

    // Verify password
    const isMatch = await Patient.verifyPassword(password, patient.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(patient.id);

    res.json({
      success: true,
      data: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        location: patient.location,
        is_verified: patient.is_verified,
        is_blocked: patient.is_blocked,
        role: 'patient',
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login' 
    });
  }
};

// @desc    Get current patient profile
// @route   GET /api/patients/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // req.user set by auth middleware
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Patient not found' 
      });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Update current patient profile
// @route   PUT /api/patients/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, date_of_birth, location } = req.body;

    if (!name || !phone || !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, phone, and location'
      });
    }

    const updated = await Patient.update(req.user.id, {
      name,
      phone,
      date_of_birth,
      location
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

module.exports = {
  registerPatient,
  loginPatient,
  getProfile,
  updateProfile
};