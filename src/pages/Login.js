import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { isValidEmail } from '../utils/auth';
import api from '../api';
import Loader from '../components/Loader';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthContext();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call login API
      const response = await api.post('/api/v1/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });

      const { token, refresh_token, user, expires_in } = response.data;

      // Store authentication data
      login(token, user, refresh_token, expires_in);

      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          setServerError('Invalid email or password');
        } else if (error.response.status === 429) {
          setServerError('Too many login attempts. Please try again later');
        } else if (error.response.status === 500) {
          setServerError('Server error. Please try again later');
        } else {
          setServerError(error.response.data?.message || 'Login failed');
        }
      } else if (error.request) {
        // Request made but no response
        setServerError('Network error. Please check your connection');
      } else {
        // Other errors
        setServerError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle demo login (for testing)
   */
  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123',
      rememberMe: false
    });
    
    // Simulate a delay
    setTimeout(() => {
      // For demo purposes, you could either submit the form or
      // directly call a demo endpoint
    }, 100);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {/* Logo and Title */}
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">🚀</span>
            </div>
            <h1 className="login-title">API Lifecycle Portal</h1>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">{serverError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Link to="/forgot-password" className="form-link">
                  Forgot password?
                </Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Remember me for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo Login Button */}
            <button
              type="button"
              className="btn-secondary btn-full"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              🎯 Try Demo Account
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="form-link-strong">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span className="feature-text">Secure authentication</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span className="feature-text">Real-time analytics</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">Fast performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
