import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import '../styles/VideoCallModal.css';

const VideoCallModal = ({ roomId, appointmentId, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasJoined = useRef(false);

  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomId)}`;

  // Record video join event
  useEffect(() => {
    const recordJoin = async () => {
      if (hasJoined.current || !appointmentId) return;
      hasJoined.current = true;
      
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/video/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        console.log('[VideoCall] Join event recorded');
      } catch (err) {
        console.error('[VideoCall] Failed to record join:', err);
      }
    };

    recordJoin();

    // Record leave event on unmount
    return () => {
      if (appointmentId && hasJoined.current) {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/video/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }).catch(err => {
          console.error('[VideoCall] Failed to record leave:', err);
        });
      }
    };
  }, [appointmentId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleOpenNewTab = () => {
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEndCall = async () => {
    // Record leave before closing
    if (appointmentId && hasJoined.current) {
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/video/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('[VideoCall] Failed to record leave:', err);
      }
    }
    onClose();
  };

  if (isMinimized) {
    return (
      <div className="mc-video-call-minimized" onClick={() => setIsMinimized(false)}>
        <div className="mc-video-call-minimized__content">
          <span className="mc-video-call-minimized__indicator" />
          <span>Video Call Active</span>
          <span className="mc-video-call-minimized__duration">{formatDuration(callDuration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-video-call-overlay">
      <div className="mc-video-call-modal">
        <div className="mc-video-call-modal__header">
          <div className="mc-video-call-modal__info">
            <span className="mc-video-call-modal__live-indicator" />
            <span className="mc-video-call-modal__title">
              Video Consultation
            </span>
            <span className="mc-video-call-modal__duration">
              {formatDuration(callDuration)}
            </span>
          </div>
          <div className="mc-video-call-modal__actions">
            <button
              type="button"
              className="mc-video-call-modal__btn mc-video-call-modal__btn--new-tab"
              onClick={handleOpenNewTab}
              title="Open in new tab"
            >
              Open in New Tab
            </button>
            <button
              type="button"
              className="mc-video-call-modal__btn mc-video-call-modal__btn--minimize"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              —
            </button>
            <button
              type="button"
              className="mc-video-call-modal__btn mc-video-call-modal__btn--close"
              onClick={handleEndCall}
              title="End call"
            >
              End Call
            </button>
          </div>
        </div>
        <div className="mc-video-call-modal__body">
          {isLoading && (
            <div className="mc-video-call-modal__loading">
              <div className="mc-video-call-modal__spinner" />
              <p>Connecting to video call...</p>
            </div>
          )}
          <iframe
            src={jitsiUrl}
            title="Video Consultation"
            className="mc-video-call-modal__iframe"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            onLoad={handleIframeLoad}
          />
        </div>
        <div className="mc-video-call-modal__footer">
          <p className="mc-video-call-modal__tip">
            Tip: Ensure your camera and microphone are enabled. For best experience, use Chrome or Firefox.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
