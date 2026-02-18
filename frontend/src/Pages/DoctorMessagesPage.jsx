import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import '../styles/DoctorMessagesPage.css';

const DoctorMessagesPage = () => {
  return (
    <div className="mc-doctor-messages">
      <DoctorSidebar />
      <main className="mc-doctor-messages__content">
        <header className="mc-doctor-messages__header">
          <h1>Messages</h1>
          <p>Stay in touch with your patients and support team.</p>
        </header>

        <section className="mc-doctor-messages__card">
          <p className="mc-doctor-messages__empty">No messages yet.</p>
          <button className="mc-doctor-messages__cta" type="button">Compose Message</button>
        </section>
      </main>
    </div>
  );
};

export default DoctorMessagesPage;
