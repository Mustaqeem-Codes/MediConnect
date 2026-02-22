// backend/controllers/messageController.js
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');

const canAccessAppointment = (appointment, user) => {
  if (!appointment) return false;
  if (user.role === 'patient') return appointment.patient_id === user.id;
  if (user.role === 'doctor') return appointment.doctor_id === user.id;
  return false;
};

const isInteractionClosed = (appointment) => Boolean(appointment?.interaction_closed_at || appointment?.report_submitted_at);

// @desc    Get messages for an appointment
// @route   GET /api/messages/appointments/:appointmentId
// @access  Private (patient, doctor)
const getAppointmentMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!canAccessAppointment(appointment, req.user)) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (isInteractionClosed(appointment)) {
      return res.status(403).json({
        success: false,
        error: 'Conversation is closed after report submission'
      });
    }

    const messages = await Message.findByAppointment(appointmentId);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Send message for an appointment
// @route   POST /api/messages/appointments/:appointmentId
// @access  Private (patient, doctor)
const sendAppointmentMessage = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message is too long' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!canAccessAppointment(appointment, req.user)) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (isInteractionClosed(appointment)) {
      return res.status(403).json({
        success: false,
        error: 'Conversation is closed after report submission'
      });
    }

    if (req.user.role === 'doctor') {
      const allowedStatuses = ['pending', 'confirmed', 'rejected', 'completed'];
      if (!allowedStatuses.includes(appointment.status)) {
        return res.status(403).json({
          success: false,
          error: 'Messages are only available for active appointments'
        });
      }

      if (appointment.status === 'rejected') {
        const doctorMessageCount = await Message.countDoctorMessagesByAppointment(appointmentId);
        if (doctorMessageCount > 0) {
          return res.status(403).json({
            success: false,
            error: 'Only one message is allowed for rejected appointments'
          });
        }
        if (trimmedMessage.length < 10) {
          return res.status(400).json({
            success: false,
            error: 'Please provide a clear reason for the rejection (min 10 characters)'
          });
        }
      }
    }

    const created = await Message.create({
      appointment_id: appointmentId,
      sender_role: req.user.role,
      sender_id: req.user.id,
      body: trimmedMessage
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getAppointmentMessages,
  sendAppointmentMessage
};
