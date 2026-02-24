// backend/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Review = require('../models/Review');
const MedicalRecordAccessRequest = require('../models/MedicalRecordAccessRequest');

const ALLOWED_CONSULTATION_TYPES = ['physical_checkup', 'video_consultation'];

const HOUR_CAPACITY_UNITS = 6; // 6 units/hour = 60 minutes when 1 unit = 10 minutes
const clampInt = (value, min, max) => Math.max(min, Math.min(max, value));

const triageEstimatedDurationUnits = ({ consultation_type, reason }) => {
  const baseUnits = consultation_type === 'physical_checkup' ? 3 : 2;
  const text = String(reason || '').toLowerCase();

  let extra = 0;
  if (text.split(/\s+/).filter(Boolean).length >= 25) extra += 1;
  if (/(chest\s+pain|shortness\s+of\s+breath|breathing\s+problem|faint|seizure)/i.test(text)) extra += 2;
  if (/(diabetes|hypertension|bp\s+high|pregnan|asthma|heart\s+disease|cancer)/i.test(text)) extra += 1;
  if (/(multiple\s+symptom|severe|worsen|unbearable|high\s+fever)/i.test(text)) extra += 1;

  return clampInt(baseUnits + extra, 1, HOUR_CAPACITY_UNITS);
};

const toHHMMSS = (value) => {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split(':').map((item) => item.trim());
  if (parts.length < 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};

const normalizeTimeForCompare = (time) => String(time).slice(0, 5);

const generateHourlySlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return slots;
};

const getDoctorBaseSlots = (doctor) => {
  if (!doctor) return [];
  if (doctor.availability_mode === '24_7') {
    return generateHourlySlots();
  }

  const slots = Array.isArray(doctor.availability_slots) ? doctor.availability_slots : [];
  return slots
    .map((slot) => toHHMMSS(slot))
    .filter(Boolean)
    .map((slot) => normalizeTimeForCompare(slot));
};

const getAvailableSlotsForDoctorAndDate = async ({
  doctor,
  doctor_id,
  appointment_date,
  required_units = 2
}) => {
  const baseSlots = getDoctorBaseSlots(doctor);
  const unitsRequired = clampInt(Number(required_units) || 2, 1, HOUR_CAPACITY_UNITS);
  const usage = await Appointment.getBookedUnitsByHour({ doctor_id, appointment_date });

  return baseSlots.filter((slot) => {
    const hour = Number(String(slot).slice(0, 2));
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;
    const usedUnits = usage.get(hour) || 0;
    const remainingUnits = HOUR_CAPACITY_UNITS - usedUnits;
    return remainingUnits >= unitsRequired;
  });
};

// @desc    Triage estimate (appointment type + duration units)
// @route   POST /api/appointments/triage
// @access  Public
const triageAppointment = async (req, res) => {
  try {
    const { consultation_type, reason } = req.body;
    const normalizedConsultationType = ALLOWED_CONSULTATION_TYPES.includes(consultation_type)
      ? consultation_type
      : 'physical_checkup';
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

    if (!trimmedReason) {
      return res.status(400).json({ success: false, error: 'Reason/symptoms are required' });
    }

    const estimatedUnits = triageEstimatedDurationUnits({
      consultation_type: normalizedConsultationType,
      reason: trimmedReason
    });

    res.json({
      success: true,
      data: {
        appointment_type: normalizedConsultationType,
        estimated_duration_units: estimatedUnits
      }
    });
  } catch (error) {
    console.error('Triage appointment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (patient)
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason, consultation_type } = req.body;
    const normalizedTime = toHHMMSS(appointment_time);
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    const normalizedConsultationType = ALLOWED_CONSULTATION_TYPES.includes(consultation_type)
      ? consultation_type
      : 'physical_checkup';

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        error: 'Please provide doctor, date, and time'
      });
    }

    if (!trimmedReason) {
      return res.status(400).json({
        success: false,
        error: 'Reason for appointment is required'
      });
    }

    const hasPendingMandatoryReview = await Review.hasPendingMandatoryDoctorReviewByPatient(req.user.id);
    if (hasPendingMandatoryReview) {
      return res.status(403).json({
        success: false,
        error: 'Please submit your pending doctor review from your previous completed consultation before booking a new appointment'
      });
    }

    if (!normalizedTime) {
      return res.status(400).json({ success: false, error: 'Invalid appointment time format' });
    }

    const bookableDoctor = await Appointment.isDoctorBookable(doctor_id);
    if (!bookableDoctor) {
      return res.status(400).json({
        success: false,
        error: 'Doctor is not available for booking until verification is complete'
      });
    }

    const doctor = await Doctor.findById(doctor_id);
    const estimatedUnits = triageEstimatedDurationUnits({
      consultation_type: normalizedConsultationType,
      reason: trimmedReason
    });
    const availableSlots = await getAvailableSlotsForDoctorAndDate({
      doctor,
      doctor_id,
      appointment_date,
      required_units: estimatedUnits
    });

    const requestedHHMM = normalizeTimeForCompare(normalizedTime);
    if (!availableSlots.includes(requestedHHMM)) {
      return res.status(409).json({
        success: false,
        error: 'Selected slot is not available',
        data: {
          available_slots: availableSlots
        }
      });
    }

    const appointment = await Appointment.create({
      patient_id: req.user.id,
      doctor_id,
      appointment_date,
      appointment_time: normalizedTime,
      reason: trimmedReason,
      consultation_type: normalizedConsultationType,
      appointment_type: normalizedConsultationType,
      duration_units: estimatedUnits
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get available slots for a doctor on a date
// @route   GET /api/appointments/doctor/:doctorId/slots?date=YYYY-MM-DD
// @access  Public
const getDoctorAvailableSlots = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const appointmentDate = req.query.date;
    const requiredUnits = req.query.units;

    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ success: false, error: 'Invalid doctor id' });
    }

    if (!appointmentDate) {
      return res.status(400).json({ success: false, error: 'date query parameter is required' });
    }

    const doctor = await Doctor.findPublicById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const slots = await getAvailableSlotsForDoctorAndDate({
      doctor,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      required_units: requiredUnits
    });

    res.json({
      success: true,
      data: {
        doctor_id: doctorId,
        date: appointmentDate,
        availability_mode: doctor.availability_mode,
        capacity_units_per_hour: HOUR_CAPACITY_UNITS,
        required_units: clampInt(Number(requiredUnits) || 2, 1, HOUR_CAPACITY_UNITS),
        available_slots: slots
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
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
    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'disputed', 'no_show'];

    console.log('[updateAppointmentStatus] Request received:', {
      appointmentId: id,
      requestedStatus: status,
      doctorId: req.user?.id,
      userId: req.user
    });

    if (!status) {
      console.log('[updateAppointmentStatus] Error: Status is required');
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!allowedStatuses.includes(status)) {
      console.log('[updateAppointmentStatus] Error: Invalid status value:', status);
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    if (!req.user || !req.user.id) {
      console.log('[updateAppointmentStatus] Error: No user in request');
      return res.status(401).json({
        success: false,
        error: 'User authentication failed'
      });
    }

    console.log('[updateAppointmentStatus] Calling Appointment.updateStatus with:', {
      id,
      doctor_id: req.user.id,
      status
    });

    const updated = await Appointment.updateStatus({ id, doctor_id: req.user.id, status });
    
    console.log('[updateAppointmentStatus] Update result:', updated);

    if (!updated) {
      console.log('[updateAppointmentStatus] Error: Appointment not found or not owned by doctor');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    console.log('[updateAppointmentStatus] Success:', updated.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[updateAppointmentStatus] Caught error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}`,
      errorCode: error.code || 'UNKNOWN'
    });
  }
};

// @desc    Submit doctor treatment report for an appointment
// @route   PUT /api/appointments/:id/report
// @access  Private (doctor)
const submitAppointmentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      treatment_summary,
      medical_report,
      medicines,
      prescriptions,
      recommendations,
      diagnosis,
      medication_array,
      clinical_findings,
      patient_instructions
    } = req.body;

    if (!treatment_summary || !String(treatment_summary).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Treatment summary is required'
      });
    }

    if (!medical_report || !String(medical_report).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Medical report is required'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check if report is locked (past addendum window)
    if (appointment.report_locked_at) {
      return res.status(403).json({
        success: false,
        error: 'Report is locked and cannot be modified (addendum window expired)'
      });
    }

    if (!ALLOWED_CONSULTATION_TYPES.includes(appointment.consultation_type)) {
      return res.status(400).json({
        success: false,
        error: 'Report submission is only supported for physical checkup or video consultation appointments'
      });
    }

    // For video consultations, validate overlap duration
    if (appointment.consultation_type === 'video_consultation') {
      const eligibility = await Appointment.canMarkCompleted(id);
      if (!eligibility.eligible && eligibility.reason === 'Insufficient video overlap (min 3 minutes required)') {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete: Both parties must be present in video call for at least 3 minutes'
        });
      }
    }

    // Validate medication_array structure
    const validatedMedicationArray = Array.isArray(medication_array)
      ? medication_array.filter(med => med && med.drug_name).map(med => ({
          drug_name: String(med.drug_name || '').trim(),
          dosage: String(med.dosage || '').trim(),
          frequency: String(med.frequency || '').trim(),
          duration: String(med.duration || '').trim()
        }))
      : [];

    // Validate diagnosis array
    const validatedDiagnosis = Array.isArray(diagnosis)
      ? diagnosis.filter(d => d && (d.code || d.name)).map(d => ({
          code: String(d.code || '').trim(),
          name: String(d.name || '').trim(),
          type: d.type || 'custom' // 'icd10' or 'custom'
        }))
      : [];

    const updated = await Appointment.submitDoctorReport({
      id,
      doctor_id: req.user.id,
      treatment_summary: String(treatment_summary).trim(),
      medical_report: String(medical_report).trim(),
      medicines: Array.isArray(medicines)
        ? medicines.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
      prescriptions: prescriptions ? String(prescriptions).trim() : null,
      recommendations: recommendations ? String(recommendations).trim() : null,
      diagnosis: validatedDiagnosis,
      medication_array: validatedMedicationArray,
      clinical_findings: clinical_findings ? String(clinical_findings).trim() : null,
      patient_instructions: patient_instructions ? String(patient_instructions).trim() : null
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Submit appointment report error:', error);
    if (error.message === 'Report is locked and cannot be modified') {
      return res.status(403).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get latest patient record for doctor's accepted appointment
// @route   GET /api/appointments/:id/patient-record/latest
// @access  Private (doctor)
const getLatestPatientRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (!['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(403).json({ success: false, error: 'Record view is available only after appointment acceptance' });
    }

    const latest = await Appointment.findLatestRecordByPatientId(appointment.patient_id);
    res.json({ success: true, data: latest || null });
  } catch (error) {
    console.error('Get latest patient record error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Request full patient record access
// @route   POST /api/appointments/:id/patient-record/request-access
// @access  Private (doctor)
const requestFullPatientRecordAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const appointment = await Appointment.findById(id);

    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (!['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(403).json({ success: false, error: 'Access request is available only for accepted appointments' });
    }

    const request = await MedicalRecordAccessRequest.create({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      reason: reason ? String(reason).trim() : null
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Request full patient record access error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get full patient record history (requires patient-approved access)
// @route   GET /api/appointments/:id/patient-record/full
// @access  Private (doctor)
const getFullPatientRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const hasAccess = await MedicalRecordAccessRequest.hasApprovedAccess({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Full record access is not granted by patient yet'
      });
    }

    const history = await Appointment.findRecordHistoryByPatientId(appointment.patient_id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get full patient record error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// =============== Video Audit Trail Endpoints ===============

// @desc    Record video call join event
// @route   POST /api/appointments/:id/video/join
// @access  Private (doctor or patient)
const recordVideoJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Validate user is part of this appointment
    const role = req.user.role;
    if (role === 'doctor' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (appointment.consultation_type !== 'video_consultation') {
      return res.status(400).json({ success: false, error: 'Not a video consultation' });
    }

    const updated = await Appointment.recordVideoJoin({
      id,
      role,
      user_id: req.user.id
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Record video join error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Record video call leave event
// @route   POST /api/appointments/:id/video/leave
// @access  Private (doctor or patient)
const recordVideoLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const role = req.user.role;
    if (role === 'doctor' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Calculate overlap duration when either party leaves
    await Appointment.calculateOverlapDuration(id);

    const updated = await Appointment.recordVideoLeave({
      id,
      role,
      user_id: req.user.id
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Record video leave error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// =============== Dispute Handling Endpoints ===============

// @desc    Raise a dispute on an appointment (patient reports provider no-show)
// @route   POST /api/appointments/:id/dispute
// @access  Private (patient)
const raiseDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (!['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'Disputes can only be raised for confirmed or completed appointments'
      });
    }

    const updated = await Appointment.raiseDispute({
      id,
      raised_by: 'patient',
      reason: reason || 'Provider did not show'
    });

    if (!updated) {
      return res.status(400).json({ success: false, error: 'Failed to raise dispute' });
    }

    res.json({ success: true, data: updated, message: 'Dispute raised. Admin will review.' });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Resolve a dispute (admin only)
// @route   PUT /api/appointments/:id/dispute/resolve
// @access  Private (admin)
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!['provider_favor', 'patient_favor', 'mutual'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resolution. Must be: provider_favor, patient_favor, or mutual'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (appointment.status !== 'disputed') {
      return res.status(400).json({ success: false, error: 'Appointment is not in disputed status' });
    }

    const updated = await Appointment.resolveDispute({
      id,
      resolution,
      resolved_by: `admin:${req.user.id}`
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Mark appointment as no-show
// @route   POST /api/appointments/:id/no-show
// @access  Private (doctor or system)
const markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { no_show_party } = req.body;

    if (!['provider', 'patient'].includes(no_show_party)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid no_show_party. Must be: provider or patient'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Only doctor can mark patient as no-show
    if (no_show_party === 'patient' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updated = await Appointment.markNoShow({ id, no_show_party });

    if (!updated) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark as no-show. Ensure appointment is confirmed and the party has not joined.'
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Mark no-show error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get patient medical history for current appointment
// @route   GET /api/appointments/:id/patient-history
// @access  Private (doctor)
const getPatientMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (!['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(403).json({
        success: false,
        error: 'Medical history is available only after appointment acceptance'
      });
    }

    const history = await Appointment.getPatientMedicalHistory(appointment.patient_id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get patient medical history error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get video audit log for an appointment (admin)
// @route   GET /api/appointments/:id/video/audit
// @access  Private (admin)
const getVideoAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: {
        id: appointment.id,
        provider_join_time: appointment.provider_join_time,
        patient_join_time: appointment.patient_join_time,
        overlap_duration_seconds: appointment.overlap_duration_seconds,
        video_audit_log: appointment.video_audit_log,
        status: appointment.status,
        dispute_raised_at: appointment.dispute_raised_at,
        dispute_raised_by: appointment.dispute_raised_by,
        dispute_resolved_at: appointment.dispute_resolved_at,
        dispute_resolution: appointment.dispute_resolution
      }
    });
  } catch (error) {
    console.error('Get video audit log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getDoctorAvailableSlots,
  triageAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  submitAppointmentReport,
  getLatestPatientRecord,
  requestFullPatientRecordAccess,
  getFullPatientRecord,
  // Video audit trail
  recordVideoJoin,
  recordVideoLeave,
  getVideoAuditLog,
  // Dispute handling
  raiseDispute,
  resolveDispute,
  markNoShow,
  // Medical history
  getPatientMedicalHistory
};
