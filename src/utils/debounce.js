/**
 * Debounce Utility
 * Delays execution of a function until after a specified time has elapsed
 * since the last time it was invoked.
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 300ms)
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge of the timeout
 * @param {boolean} options.trailing - Invoke on the trailing edge of the timeout
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300, options = {}) => {
  let timeoutId = null;
  let lastCallTime = 0;
  
  const { leading = false, trailing = true } = options;
  
  const debounced = function (...args) {
    const context = this;
    const currentTime = Date.now();
    const timeSinceLastCall = currentTime - lastCallTime;
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    lastCallTime = currentTime;
    
    // Leading edge invocation
    if (leading && timeSinceLastCall >= wait) {
      func.apply(context, args);
    }
    
    // Trailing edge invocation
    if (trailing) {
      timeoutId = setTimeout(() => {
        func.apply(context, args);
        timeoutId = null;
      }, wait);
    }
  };
  
  // Cancel method to clear the timeout
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced;
};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle (default: 300ms)
 * @returns {Function} - Throttled function
 */
export const throttle = (func, wait = 300) => {
  let timeoutId = null;
  let lastExecutedTime = 0;
  
  return function (...args) {
    const context = this;
    const currentTime = Date.now();
    const timeSinceLastExecution = currentTime - lastExecutedTime;
    
    if (timeSinceLastExecution >= wait) {
      func.apply(context, args);
      lastExecutedTime = currentTime;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(context, args);
        lastExecutedTime = Date.now();
        timeoutId = null;
      }, wait - timeSinceLastExecution);
    }
  };
};

export default debounce;
