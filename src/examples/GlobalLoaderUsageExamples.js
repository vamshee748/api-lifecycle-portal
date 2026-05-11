/**
 * GLOBAL LOADER USAGE EXAMPLES
 * 
 * This file demonstrates various patterns for using the global loader
 * in different scenarios throughout the application.
 */

// ==============================================================
// PATTERN 1: Using the useLoader Hook in Components
// ==============================================================

import { useLoader } from '../context/LoaderContext';

function MyComponent() {
  const { showLoader, hideLoader } = useLoader();

  const handleAction = async () => {
    try {
      showLoader('Processing your request...');
      
      // Perform async operation
      await someAsyncOperation();
      
    } catch (error) {
      console.error(error);
    } finally {
      hideLoader();
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}


// ==============================================================
// PATTERN 2: Using api-enhanced.js (Automatic Loader Integration)
// ==============================================================

// Simply import and use the enhanced API - loader is automatic for
// POST, PUT, PATCH, DELETE requests

import api from '../api-enhanced';

async function createResource() {
  // Loader automatically shows "Creating..." and hides when done
  const response = await api.post('/api/v1/resources', { name: 'New Resource' });
  return response.data;
}

async function updateResource(id, data) {
  // Loader automatically shows "Updating..." and hides when done
  const response = await api.put(`/api/v1/resources/${id}`, data);
  return response.data;
}

async function deleteResource(id) {
  // Loader automatically shows "Deleting..." and hides when done
  const response = await api.delete(`/api/v1/resources/${id}`);
  return response.data;
}


// ==============================================================
// PATTERN 3: Using useApiWithLoader Hook for Custom Loading Text
// ==============================================================

import { useApiWithLoader } from '../hooks/useApiWithLoader';
import { fetchAllApis } from '../api';

function ApiListComponent() {
  const { executeWithLoader } = useApiWithLoader();

  const loadApis = async () => {
    try {
      const apis = await executeWithLoader(
        () => fetchAllApis(),
        'Loading API catalog...',  // Custom loading text
        true                        // Show loader (default: true)
      );
      
      // Use the apis data
      console.log(apis);
    } catch (error) {
      console.error('Failed to load APIs:', error);
    }
  };

  return <button onClick={loadApis}>Load APIs</button>;
}


// ==============================================================
// PATTERN 4: Manual Loader Control (for complex operations)
// ==============================================================

import { useLoader } from '../context/LoaderContext';

function ComplexOperationComponent() {
  const { showLoader, hideLoader, forceHideLoader } = useLoader();

  const performComplexOperation = async () => {
    try {
      showLoader('Step 1: Validating...');
      await step1();

      showLoader('Step 2: Processing...');
      await step2();

      showLoader('Step 3: Finalizing...');
      await step3();

    } catch (error) {
      console.error(error);
      // Force hide to clear all loader counters
      forceHideLoader();
    } finally {
      hideLoader();
    }
  };

  return <button onClick={performComplexOperation}>Start Complex Operation</button>;
}


// ==============================================================
// PATTERN 5: Multiple Simultaneous Requests (Counter-based)
// ==============================================================

import { useLoader } from '../context/LoaderContext';

function BatchOperationComponent() {
  const { showLoader, hideLoader } = useLoader();

  const performBatchOperation = async () => {
    const items = [1, 2, 3, 4, 5];
    
    // Loader will show until ALL operations complete
    // Each showLoader increments counter, each hideLoader decrements
    const promises = items.map(async (item) => {
      showLoader(`Processing item ${item}...`);
      try {
        await processItem(item);
      } finally {
        hideLoader();
      }
    });

    await Promise.all(promises);
    // Loader automatically hides when counter reaches 0
  };

  return <button onClick={performBatchOperation}>Process Batch</button>;
}


// ==============================================================
// PATTERN 6: Conditional Loader (Skip for background operations)
// ==============================================================

import { useApiWithLoader } from '../hooks/useApiWithLoader';

function ConditionalLoaderComponent() {
  const { executeWithLoader } = useApiWithLoader();

  const silentRefresh = async () => {
    // Don't show loader for background refresh
    await executeWithLoader(
      () => fetchData(),
      'Loading...',
      false  // showLoading = false
    );
  };

  const userInitiatedLoad = async () => {
    // Show loader for user-initiated action
    await executeWithLoader(
      () => fetchData(),
      'Loading your data...',
      true  // showLoading = true
    );
  };

  return (
    <>
      <button onClick={silentRefresh}>Silent Refresh</button>
      <button onClick={userInitiatedLoad}>Load Data</button>
    </>
  );
}


// ==============================================================
// PATTERN 7: Integration with Existing API Calls (ApiList Pattern)
// ==============================================================

import { useLoader } from '../context/LoaderContext';
import { createApi, updateApi, deleteApi } from '../api';

function ApiManagementComponent() {
  const { showLoader, hideLoader } = useLoader();

  const handleCreate = async (apiData) => {
    try {
      showLoader('Creating API...');
      const newApi = await createApi(apiData);
      // Handle success
      return newApi;
    } catch (error) {
      console.error('Failed to create API:', error);
      throw error;
    } finally {
      hideLoader();
    }
  };

  const handleUpdate = async (id, apiData) => {
    try {
      showLoader('Updating API...');
      const updatedApi = await updateApi(id, apiData);
      return updatedApi;
    } catch (error) {
      console.error('Failed to update API:', error);
      throw error;
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id) => {
    try {
      showLoader('Deleting API...');
      await deleteApi(id);
      // Handle success
    } catch (error) {
      console.error('Failed to delete API:', error);
      throw error;
    } finally {
      hideLoader();
    }
  };

  return (
    <div>
      {/* Your UI components here */}
    </div>
  );
}


// ==============================================================
// BEST PRACTICES
// ==============================================================

/**
 * 1. Always use try-catch-finally with manual loader control
 *    - Ensures loader is hidden even if operation fails
 * 
 * 2. Use api-enhanced.js for standard CRUD operations
 *    - Automatic loader integration for POST/PUT/PATCH/DELETE
 *    - Consistent loading messages
 * 
 * 3. Use useLoader hook for custom operations
 *    - When you need specific loading messages
 *    - When operation doesn't use the API
 * 
 * 4. Don't show loader for background operations
 *    - Silent refreshes
 *    - Auto-save operations
 *    - Analytics/tracking calls
 * 
 * 5. Loader counter handles multiple simultaneous requests
 *    - No need to manually track multiple operations
 *    - Loader hides only when all operations complete
 * 
 * 6. Use forceHideLoader() sparingly
 *    - Only in error recovery scenarios
 *    - When you need to reset the loader state
 * 
 * 7. Provide meaningful loading messages
 *    - "Creating API..." instead of "Loading..."
 *    - "Validating policy..." instead of "Please wait..."
 */


// ==============================================================
// ANTI-PATTERNS (DO NOT DO THIS)
// ==============================================================

// ❌ BAD: Forgetting to hide loader
async function badExample1() {
  showLoader('Loading...');
  await fetchData();
  // Missing hideLoader() - loader stuck forever!
}

// ❌ BAD: Not using try-finally
async function badExample2() {
  showLoader('Loading...');
  try {
    await fetchData();
    hideLoader(); // Won't execute if error occurs!
  } catch (error) {
    console.error(error);
  }
}

// ✅ GOOD: Using try-finally
async function goodExample() {
  try {
    showLoader('Loading...');
    await fetchData();
  } catch (error) {
    console.error(error);
  } finally {
    hideLoader(); // Always executes!
  }
}

// ❌ BAD: Showing loader for every GET request
async function badExample3() {
  showLoader('Loading...'); // Don't show for simple reads
  const data = await api.get('/api/v1/data');
  hideLoader();
}

// ✅ GOOD: Use local loader for page data fetching
function goodExample3() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.get('/api/v1/data');
        // Process data
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loader />;
  // Render content
}
