import { NavLink } from 'react-router-dom';
import '../../styles/dashboard/PatientSidebar.css';

const PatientSidebar = () => {
  return (
    <aside className="mc-patient-sidebar">
      <div className="mc-patient-sidebar__brand">
        <span className="mc-patient-sidebar__logo">MC</span>
        <div>
          <p className="mc-patient-sidebar__title">MediConnect</p>
          <p className="mc-patient-sidebar__subtitle">Patient Portal</p>
        </div>
      </div>

      <nav className="mc-patient-sidebar__nav">
        <NavLink to="/dashboard/patient" className="mc-patient-sidebar__link">
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/patient/profile" className="mc-patient-sidebar__link">
          Profile & Settings
        </NavLink>
        <NavLink to="/dashboard/patient/appointments" className="mc-patient-sidebar__link">
          Appointments
        </NavLink>
        <NavLink to="/dashboard/patient/messages" className="mc-patient-sidebar__link">
          Messages
        </NavLink>
      </nav>

      <div className="mc-patient-sidebar__footer">
        <p>Need help?</p>
        <button type="button" className="mc-patient-sidebar__support">Contact Support</button>
      </div>
    </aside>
  );
};

export default PatientSidebar;
