import { Link } from 'react-router-dom';
import '../../styles/dashboard/AppointmentsList.css';

const AppointmentsList = ({ items = [] }) => {
  return (
    <section className="mc-appointments">
      <div className="mc-appointments__header">
        <h2>Upcoming Appointments</h2>
        <Link to="/doctors" className="mc-appointments__cta">Book Appointment</Link>
      </div>

      {items.length === 0 ? (
        <div className="mc-appointments__empty">
          <p>No appointments scheduled yet.</p>
          <span>Start by booking a visit with a specialist.</span>
        </div>
      ) : (
        <ul className="mc-appointments__list">
          {items.map((item) => (
            <li key={item.id} className="mc-appointments__item">
              <div>
                <p className="mc-appointments__doctor">{item.doctor}</p>
                <span className="mc-appointments__meta">{item.specialty}</span>
              </div>
              <div className="mc-appointments__time">
                <span>{item.date}</span>
                <span>{item.time}</span>
              </div>
              <span className={`mc-appointments__status mc-appointments__status--${item.status}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AppointmentsList;
