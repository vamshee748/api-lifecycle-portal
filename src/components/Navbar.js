import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🔄</span>
          <span className="brand-text">API Lifecycle Portal</span>
        </Link>

        <div className="navbar-actions">
          <button className="navbar-notification" aria-label="Notifications">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>

          <div className="navbar-user">
            <button 
              className="user-menu-button"
              onClick={toggleUserMenu}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="user-avatar">U</div>
              <span className="user-name">User</span>
              <span className="user-dropdown-icon">▼</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <Link to="/profile" className="dropdown-item">Profile</Link>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <hr className="dropdown-divider" />
                <button className="dropdown-item">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;