import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import PatientDashboardPage from './Pages/PatientDashboardPage';
import PatientProfilePage from './Pages/PatientProfilePage';
import PatientAppointmentsPage from './Pages/PatientAppointmentsPage';
import PatientMessagesPage from './Pages/PatientMessagesPage';
import DoctorDashboardPage from './Pages/DoctorDashboardPage';
import DoctorAppointmentsPage from './Pages/DoctorAppointmentsPage';
import DoctorPatientsPage from './Pages/DoctorPatientsPage';
import DoctorMessagesPage from './Pages/DoctorMessagesPage';
import DoctorsPage from './Pages/DoctorsPage';
import DoctorDetailPage from './Pages/DoctorDetailPage';
import BookingPage from './Pages/BookingPage';
import PrivateRoute from './components/routing/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/book/:doctorId" element={<BookingPage />} />
        <Route
          path="/dashboard/patient"
          element={
            <PrivateRoute requiredRole="patient">
              <PatientDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/patient/profile"
          element={
            <PrivateRoute requiredRole="patient">
              <PatientProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/patient/appointments"
          element={
            <PrivateRoute requiredRole="patient">
              <PatientAppointmentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/patient/messages"
          element={
            <PrivateRoute requiredRole="patient">
              <PatientMessagesPage />
            </PrivateRoute>
          }
        />
        {/* Placeholder for doctor dashboard */}
        <Route
          path="/dashboard/doctor"
          element={
            <PrivateRoute requiredRole="doctor">
              <DoctorDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/doctor/appointments"
          element={
            <PrivateRoute requiredRole="doctor">
              <DoctorAppointmentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/doctor/patients"
          element={
            <PrivateRoute requiredRole="doctor">
              <DoctorPatientsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/doctor/messages"
          element={
            <PrivateRoute requiredRole="doctor">
              <DoctorMessagesPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;