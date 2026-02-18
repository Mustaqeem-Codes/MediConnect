// backend/controllers/appointmentController.js
const Appointment = require('../models/Appointment');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (patient)
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        error: 'Please provide doctor, date, and time'
      });
    }

    const appointment = await Appointment.create({
      patient_id: req.user.id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get appointments for current patient
// @route   GET /api/appointments/patient
// @access  Private (patient)
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findByPatientId(req.user.id);
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Patient appointments error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get appointments for current doctor
// @route   GET /api/appointments/doctor
// @access  Private (doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findByDoctorId(req.user.id);
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Doctor appointments error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (doctor)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const updated = await Appointment.updateStatus({ id, status });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus
};
