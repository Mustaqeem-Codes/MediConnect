import { useEffect, useMemo, useState } from 'react';
import '../../styles/messages/AppointmentMessages.css';
import { API_BASE_URL } from '../../config/api';

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const AppointmentMessages = ({ appointmentId, appointmentStatus, interactionClosed = false, role, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isRejected = appointmentStatus === 'rejected';
  const canSend = !interactionClosed && (role === 'patient' || appointmentStatus === 'pending' || appointmentStatus === 'confirmed' || appointmentStatus === 'rejected' || appointmentStatus === 'completed');

  const helpText = useMemo(() => {
    if (role === 'doctor' && isRejected) {
      return 'You can send one message to explain the rejection.';
    }
    if (interactionClosed) {
      return 'Conversation is closed after the doctor submitted the final report.';
    }
    if (role === 'doctor') {
      return 'Messages are available for pending and confirmed requests.';
    }
    return 'Messages are available after a request is created.';
  }, [role, isRejected, interactionClosed]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !appointmentId) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/appointments/${appointmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load messages');
        }
        setMessages(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [appointmentId]);

  const handleSend = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please sign in again to send a message.');
      return;
    }

    if (!message.trim()) {
      setError('Please type a message.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/appointments/${appointmentId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [...prev, data.data]);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mc-appointment-messages">
      <div className="mc-appointment-messages__header">
        <div>
          <h2>Conversation</h2>
          <p>{helpText}</p>
        </div>
        <button type="button" className="mc-appointment-messages__close" onClick={onClose}>Close</button>
      </div>

      {loading && <div className="mc-appointment-messages__state">Loading messages...</div>}
      {error && <div className="mc-appointment-messages__error">{error}</div>}

      {!loading && !error && (
        <div className="mc-appointment-messages__thread">
          {messages.length === 0 ? (
            <p className="mc-appointment-messages__empty">No messages yet.</p>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className={`mc-appointment-messages__bubble mc-appointment-messages__bubble--${item.sender_role}`}
              >
                <p>{item.body}</p>
                <span>{formatTimestamp(item.created_at)}</span>
              </div>
            ))
          )}
        </div>
      )}

      <form className="mc-appointment-messages__form" onSubmit={handleSend}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={canSend ? 'Write your message...' : 'Messaging is disabled'}
          rows={3}
          disabled={!canSend || sending}
        ></textarea>
        <button type="submit" disabled={!canSend || sending}>
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </section>
  );
};

export default AppointmentMessages;
