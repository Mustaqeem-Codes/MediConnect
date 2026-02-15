// frontend/src/components/home/Navbar.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/home/Navbar.css';
import logoIcon from '../../assets/MC Logo.png'; // Assuming you have a logo icon

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Will be replaced with actual auth

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Services', href: '/services' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <a href="/" className="navbar-logo">
          <span className="logo-icon"><img src={logoIcon} alt="MediConnect Logo" /></span>
          <span className="logo-text">Medi<span className="logo-highlight">Connect</span></span>
        </a>

        {/* Desktop Navigation - Now on the right with auth button */}
        <div className="navbar-right">
          <ul className="navbar-menu">
            {navLinks.map((link) => (
              <li key={link.name} className="navbar-item">
                <a href={link.href} className="navbar-link">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Single Auth Button */}
          <div className="navbar-auth">
            {!isLoggedIn ? (
              <a href="/login" className="nav-btn nav-btn-primary">
                Sign Up / Login
              </a>
            ) : (
              <a href="/dashboard" className="nav-btn nav-btn-primary">
                Dashboard
              </a>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="mobile-menu-container">
            <div className="mobile-menu-header">
              <a href="/" className="mobile-logo" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="logo-icon">🏥</span>
                <span className="logo-text">MediConnect</span>
              </a>
            </div>

            <ul className="mobile-menu">
              {navLinks.map((link) => (
                <li key={link.name} className="mobile-menu-item">
                  <a 
                    href={link.href} 
                    className="mobile-menu-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mobile-menu-auth">
              {!isLoggedIn ? (
                <a 
                  href="/login" 
                  className="mobile-btn mobile-btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up / Login
                </a>
              ) : (
                <a 
                  href="/dashboard" 
                  className="mobile-btn mobile-btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;