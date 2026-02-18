import PatientSidebar from '../components/dashboard/PatientSidebar';
import '../styles/PatientMessagesPage.css';

const PatientMessagesPage = () => {
  return (
    <div className="mc-patient-messages">
      <PatientSidebar />
      <main className="mc-patient-messages__content">
        <header className="mc-patient-messages__header">
          <h1>Messages</h1>
          <p>Chat with your care team and receive updates.</p>
        </header>

        <section className="mc-patient-messages__card">
          <p className="mc-patient-messages__empty">No messages yet.</p>
          <button className="mc-patient-messages__cta" type="button">Start a conversation</button>
        </section>
      </main>
    </div>
  );
};

export default PatientMessagesPage;
