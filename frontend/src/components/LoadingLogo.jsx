import React from 'react';
import '../styles/LoadingLogo.css';

const LoadingLogo = ({ status = 'loading' }) => {
  // status can be: 'loading' | 'success' | 'error'
  
  return (
    <div className={`medi-loader-overlay ${status === 'success' ? 'exit-active' : ''}`}>
      <div className="medi-loader-content">
        <div className={`logo-wrapper ${status}`}>
          <svg viewBox="0 0 100 100" className="medi-logo-svg">
            {/* Structural Track */}
            <path 
              className="medi-path-bg" 
              d="M20 70V30L50 50L80 30V70L50 50L20 70Z" 
            />
            {/* The Animated Energy Flow */}
            <path 
              className="medi-path-flow" 
              d="M20 70V30L50 50L80 30V70L50 50L20 70Z" 
            />
            {/* Central Connection Node */}
            <rect 
              className="medi-node" 
              x="45" y="45" width="10" height="10" 
              transform="rotate(45 50 50)" 
            />
          </svg>
        </div>
        
        <div className="medi-text-zone">
          <span className="medi-brand-name">MEDICONNECT</span>
          <div className="medi-progress-line">
            <div className="medi-progress-fill"></div>
          </div>
          <p className="medi-status-label">
            {status === 'loading' ? 'Establishing Secure Link...' : 'Connection Verified'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingLogo;