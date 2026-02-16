// frontend/src/components/home/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "../../styles/home/Navbar.css";
import logoIcon from "../../assets/MC Logo.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Will be replaced with actual auth
  const location = useLocation();

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/", type: "route" },
    { name: "Find Doctors", href: "hero", type: "scroll" },
    { name: "How It Works", href: "how-it-works", type: "scroll" },
    { name: "Services", href: "features", type: "scroll" },
    { name: "Contact", href: "cta-section", type: "scroll" },
  ];

  // Base inline styles for mobile menu links (applies to both buttons and NavLink)
  const mobileLinkBaseStyle = {
    display: "block",
    width: "100%",
    padding: "1rem 1.5rem",
    textAlign: "left",
    backgroundColor: "transparent",
    border: "none",
    color: "#0A192F",
    fontSize: "1.1rem",
    fontWeight: "500",
    textDecoration: "none",
    cursor: "pointer",
    transition: "background-color 0.2s, color 0.2s",
    // Remove default button styles for scroll buttons
    fontFamily: "inherit",
  };

  return (
    <nav className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">
            <img src={logoIcon} alt="MediConnect Logo" />
          </span>
          <span className="logo-text">
            Medi<span className="logo-highlight">Connect</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-right">
          <ul className="navbar-menu">
            {navLinks.map((link) => (
              <li
                key={link.name}
                className="navbar-item"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {link.type === "scroll" ? (
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="navbar-link navbar-link-btn"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                      padding: "0.5rem 1rem",
                      display: "inline-block",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                  >
                    {link.name}
                  </button>
                ) : (
                  <NavLink
                    to={link.href}
                    className={({ isActive }) =>
                      `navbar-link ${isActive ? "active" : ""}`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? "#1E88E5" : "#0A192F",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      display: "inline-block",
                      fontWeight: isActive ? "600" : "400",
                      transition: "color 0.2s",
                    })}
                  >
                    {link.name}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          {/* Single Auth Button - Links to Registration Page */}
          <div className="navbar-auth">
            {!isLoggedIn ? (
              <Link to="/register" className="nav-btn nav-btn-primary">
                Sign Up / Login
              </Link>
            ) : (
              <Link to="/dashboard" className="nav-btn nav-btn-primary">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Mobile Menu Overlay */}
        <div
          className={`mobile-menu-overlay ${isMobileMenuOpen ? "active" : ""}`}
        >
          <div className="mobile-menu-container">
            <div className="mobile-menu-header">
              <Link
                to="/"
                className="mobile-logo"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img src={logoIcon} alt="MediConnect Logo" />
                <span className="logo-text">MediConnect</span>
              </Link>
            </div>

            <ul className="mobile-menu">
              {navLinks.map((link) => (
                <li key={link.name} className="mobile-menu-item">
                  {link.type === "scroll" ? (
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="mobile-menu-link mobile-menu-link-btn"
                      style={mobileLinkBaseStyle}
                    >
                      {link.name}
                    </button>
                  ) : (
                    // Use NavLink for route links to get active state highlighting
                    <NavLink
                      to={link.href}
                      className="mobile-menu-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        ...mobileLinkBaseStyle,
                        color: isActive ? "#1E88E5" : "#0A192F",
                        fontWeight: isActive ? "600" : "500",
                      })}
                    >
                      {link.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>

            <div className="mobile-menu-auth">
              {!isLoggedIn ? (
                <Link
                  to="/register"
                  className="mobile-btn mobile-btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up / Login
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="mobile-btn mobile-btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;