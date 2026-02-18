// backend/controllers/doctorController.js
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, role: 'doctor' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new doctor
// @route   POST /api/doctors/register
// @access  Public
const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialty,
      licenseNumber,
      license_number
    } = req.body;

    const finalLicenseNumber = license_number || licenseNumber;

    // Basic validation
    if (!name || !email || !phone || !password || !specialty || !finalLicenseNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, phone, password, specialty and license number'
      });
    }

    const existingEmail = await Doctor.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const existingPhone = await Doctor.findByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already registered'
      });
    }

    const existingLicense = await Doctor.findByLicenseNumber(finalLicenseNumber);
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        error: 'License number already registered'
      });
    }

    const doctor = await Doctor.create({
      name,
      email,
      phone,
      password,
      license_number: finalLicenseNumber,
      specialty
    });

    const token = generateToken(doctor.id);

    res.status(201).json({
      success: true,
      data: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        license_number: doctor.license_number,
        specialty: doctor.specialty,
        is_verified: doctor.is_verified,
        is_approved: doctor.is_approved,
        role: 'doctor',
        token
      }
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// @desc    Login doctor
// @route   POST /api/doctors/login
// @access  Public
const loginDoctor = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email/phone and password'
      });
    }

    let doctor;
    if (email) {
      doctor = await Doctor.findByEmail(email);
    } else if (phone) {
      doctor = await Doctor.findByPhone(phone);
    }

    if (!doctor) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await Doctor.verifyPassword(password, doctor.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = generateToken(doctor.id);

    res.json({
      success: true,
      data: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        license_number: doctor.license_number,
        specialty: doctor.specialty,
        is_verified: doctor.is_verified,
        is_approved: doctor.is_approved,
        role: 'doctor',
        token
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Get current doctor profile
// @route   GET /api/doctors/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Doctor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    List doctors
// @route   GET /api/doctors
// @access  Public
const listDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('List doctors error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getProfile,
  listDoctors
};
