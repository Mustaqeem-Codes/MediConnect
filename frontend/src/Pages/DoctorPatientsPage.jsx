import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import '../styles/DoctorPatientsPage.css';

const DoctorPatientsPage = () => {
  const mockPatients = [
    { id: 1, name: 'Emily Carter', lastVisit: 'May 10, 2026', condition: 'Hypertension' },
    { id: 2, name: 'Michael Brown', lastVisit: 'May 12, 2026', condition: 'Eczema' },
    { id: 3, name: 'Sarah Ahmed', lastVisit: 'May 15, 2026', condition: 'Migraine' }
  ];

  return (
    <div className="mc-doctor-patients">
      <DoctorSidebar />
      <main className="mc-doctor-patients__content">
        <header className="mc-doctor-patients__header">
          <h1>Patients</h1>
          <p>Review your active patient list and recent consultations.</p>
        </header>

        <section className="mc-doctor-patients__card">
          <div className="mc-doctor-patients__list">
            {mockPatients.map((patient) => (
              <div key={patient.id} className="mc-doctor-patients__item">
                <div>
                  <p className="mc-doctor-patients__name">{patient.name}</p>
                  <span className="mc-doctor-patients__meta">Last visit: {patient.lastVisit}</span>
                </div>
                <span className="mc-doctor-patients__tag">{patient.condition}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorPatientsPage;
