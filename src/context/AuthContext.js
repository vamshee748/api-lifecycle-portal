import React, { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the application and provides authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access auth context
 * @returns {Object} - Authentication state and methods
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
