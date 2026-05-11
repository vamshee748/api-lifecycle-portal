import { useLoader } from '../context/LoaderContext';

/**
 * Custom hook that wraps API calls with global loader
 * @returns {Object} - Object with API call wrapper function
 */
export const useApiWithLoader = () => {
  const { showLoader, hideLoader } = useLoader();

  /**
   * Execute an API call with global loader
   * @param {Function} apiCall - The API function to execute
   * @param {string} loadingText - Optional loading text (default: 'Loading...')
   * @param {boolean} showLoading - Whether to show loader (default: true)
   * @returns {Promise} - Promise resolving to API response
   */
  const executeWithLoader = async (apiCall, loadingText = 'Loading...', showLoading = true) => {
    try {
      if (showLoading) {
        showLoader(loadingText);
      }
      const result = await apiCall();
      return result;
    } catch (error) {
      throw error;
    } finally {
      if (showLoading) {
        hideLoader();
      }
    }
  };

  return { executeWithLoader };
};

export default useApiWithLoader;
