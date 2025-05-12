// src/components/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Copyright © {currentYear} Policonnect</p>
      </div>
    </footer>
  );
};

export default Footer;