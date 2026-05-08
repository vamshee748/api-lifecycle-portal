import { useState, useEffect, useCallback } from 'react';
import { 
  isAuthenticated, 
  getUser, 
  setToken as storeToken, 
  setUser as storeUser,
  removeToken,
  logout as performLogout
} from '../utils/auth';

/**
 * Custom hook for managing authentication state
 * @returns {Object} - Authentication state and methods
 */
export const useAuth = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      
      if (authenticated) {
        const userData = getUser();
        setUser(userData);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Login user and store credentials
   */
  const login = useCallback((token, userData, refreshToken = null, expiresIn = null) => {
    storeToken(token, refreshToken, expiresIn);
    storeUser(userData);
    setIsAuth(true);
    setUser(userData);
  }, []);

  /**
   * Logout user and clear credentials
   */
  const logout = useCallback(() => {
    removeToken();
    setIsAuth(false);
    setUser(null);
    performLogout();
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData) => {
    storeUser(userData);
    setUser(userData);
  }, []);

  return {
    isAuthenticated: isAuth,
    user,
    loading,
    login,
    logout,
    updateUser
  };
};

export default useAuth;
