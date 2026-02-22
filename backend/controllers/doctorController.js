// backend/controllers/doctorController.js
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

const normalizeAvailabilitySlots = (slots) => {
  if (!Array.isArray(slots)) return [];

  const normalized = slots
    .map((slot) => String(slot || '').trim())
    .filter(Boolean)
    .map((slot) => {
      const parts = slot.split(':').map((value) => value.trim());
      if (parts.length < 2) return null;
      const hour = Number(parts[0]);
      const minute = Number(parts[1]);
      if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
      }
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    })
    .filter(Boolean);

  return Array.from(new Set(normalized)).sort();
};

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
      location,
      specialty,
      licenseNumber,
      license_number
    } = req.body;

    const finalLicenseNumber = license_number || licenseNumber;

    // Basic validation
    if (!name || !email || !phone || !password || !specialty || !finalLicenseNumber || !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, phone, password, specialty, license number, and location'
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
      specialty,
      location
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
        location: doctor.location,
        is_verified: doctor.is_verified,
        is_approved: doctor.is_approved,
        is_blocked: doctor.is_blocked,
        availability_mode: doctor.availability_mode,
        availability_slots: doctor.availability_slots,
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

    if (doctor.is_blocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account is blocked'
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
        location: doctor.location,
        is_verified: doctor.is_verified,
        is_approved: doctor.is_approved,
        is_blocked: doctor.is_blocked,
        availability_mode: doctor.availability_mode,
        availability_slots: doctor.availability_slots,
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
    const shouldSetAvailability = Boolean(doctor.is_verified && doctor.is_approved) &&
      !(doctor.availability_mode === '24_7' || (Array.isArray(doctor.availability_slots) && doctor.availability_slots.length > 0));

    res.json({
      success: true,
      data: {
        ...doctor,
        should_set_availability: shouldSetAvailability
      }
    });
  } catch (error) {
    console.error('Doctor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get public doctor details
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor id' });
    }

    const doctor = await Doctor.findPublicById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Get doctor detail error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/availability
// @access  Private (doctor)
const updateAvailability = async (req, res) => {
  try {
    const { availability_mode, availability_slots } = req.body;
    const mode = availability_mode === '24_7' ? '24_7' : 'custom';
    const slots = mode === '24_7' ? [] : normalizeAvailabilitySlots(availability_slots);

    if (mode === 'custom' && slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one slot for custom availability'
      });
    }

    const updated = await Doctor.updateAvailability({
      id: req.user.id,
      availability_mode: mode,
      availability_slots: slots
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
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

// @desc    Get doctor notifications
// @route   GET /api/doctors/notifications
// @access  Private (doctor)
const getDoctorNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findByDoctorId(req.user.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get doctor notifications error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Mark doctor notification as read
// @route   PUT /api/doctors/notifications/:id/read
// @access  Private (doctor)
const markNotificationRead = async (req, res) => {
  try {
    const updated = await Notification.markAsRead({ id: req.params.id, doctor_id: req.user.id });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getProfile,
  listDoctors,
  getDoctorById,
  updateAvailability,
  getDoctorNotifications,
  markNotificationRead
};
