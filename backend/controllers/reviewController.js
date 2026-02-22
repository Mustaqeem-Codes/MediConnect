const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

const normalizeRating = (value) => Number.parseInt(value, 10);

const submitDoctorReviewByPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rating, review_text } = req.body;
    const normalizedRating = normalizeRating(rating);

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.patient_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (!appointment.report_submitted_at) {
      return res.status(400).json({ success: false, error: 'Doctor review is available after report submission' });
    }

    const alreadyExists = await Review.existsForAppointment({
      appointment_id: appointment.id,
      reviewer_role: 'patient',
      reviewer_id: req.user.id,
      reviewee_role: 'doctor'
    });

    if (alreadyExists) {
      return res.status(409).json({ success: false, error: 'You already reviewed this doctor for this appointment' });
    }

    const created = await Review.create({
      appointment_id: appointment.id,
      reviewer_role: 'patient',
      reviewer_id: req.user.id,
      reviewee_role: 'doctor',
      reviewee_id: appointment.doctor_id,
      rating: normalizedRating,
      review_text: review_text ? String(review_text).trim() : null
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Submit doctor review by patient error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const submitPatientReviewByDoctor = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rating, review_text } = req.body;
    const normalizedRating = normalizeRating(rating);

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (!appointment.report_submitted_at) {
      return res.status(400).json({ success: false, error: 'Patient review is available after report submission' });
    }

    const alreadyExists = await Review.existsForAppointment({
      appointment_id: appointment.id,
      reviewer_role: 'doctor',
      reviewer_id: req.user.id,
      reviewee_role: 'patient'
    });

    if (alreadyExists) {
      return res.status(409).json({ success: false, error: 'You already reviewed this patient for this appointment' });
    }

    const created = await Review.create({
      appointment_id: appointment.id,
      reviewer_role: 'doctor',
      reviewer_id: req.user.id,
      reviewee_role: 'patient',
      reviewee_id: appointment.patient_id,
      rating: normalizedRating,
      review_text: review_text ? String(review_text).trim() : null
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Submit patient review by doctor error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const submitSoftwareReview = async (req, res) => {
  try {
    const { rating, review_text } = req.body;
    const normalizedRating = normalizeRating(rating);

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
    }

    const created = await Review.create({
      appointment_id: null,
      reviewer_role: req.user.role,
      reviewer_id: req.user.id,
      reviewee_role: 'software',
      reviewee_id: null,
      rating: normalizedRating,
      review_text: review_text ? String(review_text).trim() : null
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Submit software review error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getDoctorRatingSummary = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor id' });
    }

    const summary = await Review.getDoctorRatingSummary(doctorId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get doctor rating summary error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getSoftwareRatingSummary = async (req, res) => {
  try {
    const summary = await Review.getSoftwareRatingSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get software rating summary error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  submitDoctorReviewByPatient,
  submitPatientReviewByDoctor,
  submitSoftwareReview,
  getDoctorRatingSummary,
  getSoftwareRatingSummary
};
