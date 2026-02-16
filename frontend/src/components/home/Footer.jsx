// frontend/src/components/home/Footer.jsx
import React from 'react';
import '../../styles/home/Footer.css';
import LogoIcon from '../../assets/MC Logo.png';


const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', url: '/about' },
      { name: 'Careers', url: '/careers' },
      { name: 'Blog', url: '/blog' },
      { name: 'Press', url: '/press' },
      { name: 'Contact', url: '/contact' }
    ],
    patients: [
      { name: 'Find Doctors', url: '/doctors' },
      { name: 'Book Appointment', url: '/appointments/new' },
      { name: 'Health Articles', url: '/articles' },
      { name: 'Patient FAQs', url: '/faq/patients' },
      { name: 'Insurance Info', url: '/insurance' }
    ],
    doctors: [
      { name: 'Join as Doctor', url: '/register/doctor' },
      { name: 'Doctor Login', url: '/login/doctor' },
      { name: 'Practice Dashboard', url: '/doctor/dashboard' },
      { name: 'Doctor FAQs', url: '/faq/doctors' },
      { name: 'Support', url: '/support/doctors' }
    ],
    legal: [
      { name: 'Terms of Service', url: '/legal/terms' },
      { name: 'Privacy Policy', url: '/legal/privacy' },
      { name: 'Cookie Policy', url: '/legal/cookies' },
      { name: 'HIPAA Compliance', url: '/legal/hipaa' },
      { name: 'Accessibility', url: '/legal/accessibility' }
    ]
  };

  const socialMedia = [
    { name: 'Facebook', icon: '📘', url: 'https://facebook.com/mediconnect' },
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/mediconnect' },
    { name: 'LinkedIn', icon: '🔗', url: 'https://linkedin.com/company/mediconnect' },
    { name: 'Instagram', icon: '📷', url: 'https://instagram.com/mediconnect' },
    { name: 'YouTube', icon: '▶️', url: 'https://youtube.com/mediconnect' }
  ];

  const appStores = [
    { name: 'App Store', icon: '🍎', url: '#' },
    { name: 'Google Play', icon: '📱', url: '#' }
  ];

  return (
    <footer className="mc-footer">
      <div className="mc-footer__container">
        {/* Main Footer Content */}
        <div className="mc-footer__main">
          {/* Brand Section */}
          <div className="mc-footer__brand">
            <div className="mc-footer__logo">
              <img src={LogoIcon} alt="MediConnect Logo" className="mc-footer__logo-icon" />
              <span className="mc-footer__logo-text">Medi<span className="mc-footer__logo-highlight">Connect</span></span>
            </div>
            <p className="mc-footer__description">
              Transforming healthcare through technology. Connect with trusted doctors, 
              book appointments instantly, and manage your health journey all in one place.
            </p>
            
            {/* Contact Info */}
            <div className="mc-footer__contact">
              <div className="mc-footer__contact-item">
                <span className="mc-footer__contact-icon">📍</span>
                <span className="mc-footer__contact-text">123 Healthcare Ave, Medical District, NY 10001</span>
              </div>
              <div className="mc-footer__contact-item">
                <span className="mc-footer__contact-icon">📞</span>
                <span className="mc-footer__contact-text">+1 (800) 123-4567</span>
              </div>
              <div className="mc-footer__contact-item">
                <span className="mc-footer__contact-icon">✉️</span>
                <span className="mc-footer__contact-text">support@mediconnect.com</span>
              </div>
            </div>

            {/* App Store Badges */}
            <div className="mc-footer__app-badges">
              {appStores.map((store, index) => (
                <a key={index} href={store.url} className="mc-footer__app-badge" target="_blank" rel="noopener noreferrer">
                  <span className="mc-footer__app-icon">{store.icon}</span>
                  <span className="mc-footer__app-text">{store.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="mc-footer__links-grid">
            {/* Company Links */}
            <div className="mc-footer__links-column">
              <h4 className="mc-footer__column-title">Company</h4>
              <ul className="mc-footer__links-list">
                {footerLinks.company.map((link, index) => (
                  <li key={index} className="mc-footer__link-item">
                    <a href={link.url} className="mc-footer__link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Patients */}
            <div className="mc-footer__links-column">
              <h4 className="mc-footer__column-title">For Patients</h4>
              <ul className="mc-footer__links-list">
                {footerLinks.patients.map((link, index) => (
                  <li key={index} className="mc-footer__link-item">
                    <a href={link.url} className="mc-footer__link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Doctors */}
            <div className="mc-footer__links-column">
              <h4 className="mc-footer__column-title">For Doctors</h4>
              <ul className="mc-footer__links-list">
                {footerLinks.doctors.map((link, index) => (
                  <li key={index} className="mc-footer__link-item">
                    <a href={link.url} className="mc-footer__link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="mc-footer__links-column">
              <h4 className="mc-footer__column-title">Legal</h4>
              <ul className="mc-footer__links-list">
                {footerLinks.legal.map((link, index) => (
                  <li key={index} className="mc-footer__link-item">
                    <a href={link.url} className="mc-footer__link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mc-footer__bottom">
          <div className="mc-footer__copyright">
            © {currentYear} MediConnect. All rights reserved.
          </div>
          
          {/* Social Media Links */}
          <div className="mc-footer__social">
            {socialMedia.map((social, index) => (
              <a 
                key={index}
                href={social.url}
                className="mc-footer__social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
              >
                <span className="mc-footer__social-icon">{social.icon}</span>
              </a>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mc-footer__payment">
            <span className="mc-footer__payment-text">We Accept:</span>
            <div className="mc-footer__payment-icons">
              <span className="mc-footer__payment-icon" title="Visa">💳</span>
              <span className="mc-footer__payment-icon" title="Mastercard">💳</span>
              <span className="mc-footer__payment-icon" title="American Express">💳</span>
              <span className="mc-footer__payment-icon" title="PayPal">🅿️</span>
              <span className="mc-footer__payment-icon" title="Apple Pay">🍎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="mc-footer__pattern"></div>
    </footer>
  );
};

export default Footer;