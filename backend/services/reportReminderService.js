const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

const REMINDER_TITLE = 'Patient report pending';
const REMINDER_BODY =
  'Please update the complete patient analysis and recommendations (medicines, tests, or advice) within the mandatory reporting workflow.';

const processPendingReportReminders = async () => {
  const dueAppointments = await Appointment.findReportPendingPastDue();

  for (const appointment of dueAppointments) {
    await Notification.createDoctorReminder({
      doctor_id: appointment.doctor_id,
      appointment_id: appointment.id,
      title: REMINDER_TITLE,
      body: REMINDER_BODY
    });

    await Appointment.markReminderSent(appointment.id);
  }

  return dueAppointments.length;
};

module.exports = {
  processPendingReportReminders
};
