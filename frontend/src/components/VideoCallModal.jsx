import { useState, useEffect, useCallback } from 'react';
import '../styles/VideoCallModal.css';

const VideoCallModal = ({ roomId, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomId)}`;

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
              onClick={onClose}
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
