// frontend/src/components/home/FloatingBookButton.jsx
import React, { useState } from 'react';
import BookAppointmentModal from './BookAppointmentModal';
import '../../styles/home/FloatingBookButton.css';

const FloatingBookButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="floating-book-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="Book Appointment"
      >
        <span className="floating-book-icon">📅</span>
        <span className="floating-book-text">Book Now</span>
      </button>

      <BookAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FloatingBookButton;