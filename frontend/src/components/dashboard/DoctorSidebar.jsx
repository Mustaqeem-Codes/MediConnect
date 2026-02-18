import { NavLink } from 'react-router-dom';
import '../../styles/dashboard/DoctorSidebar.css';

const DoctorSidebar = () => {
  return (
    <aside className="mc-doctor-sidebar">
      <div className="mc-doctor-sidebar__brand">
        <span className="mc-doctor-sidebar__logo">MC</span>
        <div>
          <p className="mc-doctor-sidebar__title">MediConnect</p>
          <p className="mc-doctor-sidebar__subtitle">Doctor Portal</p>
        </div>
      </div>

      <nav className="mc-doctor-sidebar__nav">
        <NavLink to="/dashboard/doctor" className="mc-doctor-sidebar__link">
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/doctor/appointments" className="mc-doctor-sidebar__link">
          Appointments
        </NavLink>
        <NavLink to="/dashboard/doctor/patients" className="mc-doctor-sidebar__link">
          Patients
        </NavLink>
        <NavLink to="/dashboard/doctor/messages" className="mc-doctor-sidebar__link">
          Messages
        </NavLink>
      </nav>

      <div className="mc-doctor-sidebar__footer">
        <p>Need help?</p>
        <button type="button" className="mc-doctor-sidebar__support">Contact Support</button>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
