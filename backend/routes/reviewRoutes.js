const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitDoctorReviewByPatient,
  submitPatientReviewByDoctor,
  submitSoftwareReview,
  getDoctorRatingSummary,
  getSoftwareRatingSummary
} = require('../controllers/reviewController');

router.post('/appointments/:appointmentId/doctor', protect, authorize('patient'), submitDoctorReviewByPatient);
router.post('/appointments/:appointmentId/patient', protect, authorize('doctor'), submitPatientReviewByDoctor);
router.post('/software', protect, authorize('patient', 'doctor'), submitSoftwareReview);

router.get('/doctors/:doctorId/summary', getDoctorRatingSummary);
router.get('/software/summary', getSoftwareRatingSummary);

module.exports = router;
