import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LoaderContext = createContext(null);

/**
 * Global Loader Provider
 * Manages loading state across the entire application
 */
export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [loadingCount, setLoadingCount] = useState(0);

  /**
   * Show global loader
   * @param {string} text - Optional loading text
   */
  const showLoader = useCallback((text = 'Loading...') => {
    setLoadingCount((prev) => prev + 1);
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  /**
   * Hide global loader
   * Uses counter to handle multiple simultaneous requests
   */
  const hideLoader = useCallback(() => {
    setLoadingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setIsLoading(false);
      }
      return newCount;
    });
  }, []);

  /**
   * Force hide loader (reset all counters)
   */
  const forceHideLoader = useCallback(() => {
    setLoadingCount(0);
    setIsLoading(false);
  }, []);

  // Expose loader functions to window for API interceptors
  useEffect(() => {
    window.__globalLoader = {
      showLoader,
      hideLoader,
      forceHideLoader,
    };

    return () => {
      delete window.__globalLoader;
    };
  }, [showLoader, hideLoader, forceHideLoader]);

  const value = {
    isLoading,
    loadingText,
    showLoader,
    hideLoader,
    forceHideLoader,
  };

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  );
};

/**
 * Custom hook to access loader context
 * @returns {Object} - Loader state and methods
 */
export const useLoader = () => {
  const context = useContext(LoaderContext);
  
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  
  return context;
};

export default LoaderContext;
