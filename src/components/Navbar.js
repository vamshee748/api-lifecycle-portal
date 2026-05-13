import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Navbar = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const dropdownRef = useRef(null);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.name || user.email || 'User';
  };

  // Get Swagger UI URL based on environment
  const getSwaggerUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    
    // If API URL is relative path (Docker/production), use relative /api/docs
    if (!apiUrl || apiUrl.startsWith('/')) {
      return '/api/docs';
    }
    
    // Otherwise, append /docs to the API URL
    return `${apiUrl}/docs`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🚀</span>
          <span className="brand-text">API Lifecycle Portal</span>
        </Link>

        <div className="navbar-actions">
          <a 
            href={getSwaggerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-swagger-link"
            title="Open Swagger UI Documentation"
          >
            <span className="swagger-icon">📚</span>
            <span className="swagger-text">API Docs</span>
          </a>

          <button className="navbar-notification" aria-label="Notifications">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>

          <div className="navbar-user" ref={dropdownRef}>
            <button 
              className="user-menu-button"
              onClick={toggleUserMenu}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="user-avatar">{getUserInitials()}</div>
              <span className="user-name">{getUserDisplayName()}</span>
              <span className={`user-dropdown-icon ${userMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <p className="dropdown-user-name">{getUserDisplayName()}</p>
                    {user?.email && <p className="dropdown-user-email">{user.email}</p>}
                  </div>
                </div>
                <hr className="dropdown-divider" />
                <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <span className="dropdown-item-icon">👤</span>
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <span className="dropdown-item-icon">⚙️</span>
                  Settings
                </Link>
                <hr className="dropdown-divider" />
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-item-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;