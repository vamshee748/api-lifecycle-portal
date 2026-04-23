import React from 'react';

const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large',
  };

  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className={`loader-spinner ${sizeClasses[size] || sizeClasses.medium}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

export default Loader;
