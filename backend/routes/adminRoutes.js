const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  loginAdmin,
  getOverview,
  listDoctorsForAdmin,
  listPatientsForAdmin,
  setDoctorVerification,
  setDoctorBlocked,
  setPatientBlocked
} = require('../controllers/adminController');

router.post('/login', loginAdmin);

router.get('/overview', protect, authorize('admin'), getOverview);
router.get('/doctors', protect, authorize('admin'), listDoctorsForAdmin);
router.get('/patients', protect, authorize('admin'), listPatientsForAdmin);
router.put('/doctors/:id/verify', protect, authorize('admin'), setDoctorVerification);
router.put('/doctors/:id/block', protect, authorize('admin'), setDoctorBlocked);
router.put('/patients/:id/block', protect, authorize('admin'), setPatientBlocked);

module.exports = router;
