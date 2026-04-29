import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { createApi } from '../api';
import Loader from '../components/Loader';

const ApiList = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    status: 'development',
    base_url: '',
    tags: ''
  });

  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/apis');
      setApis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch APIs');
      console.error('Error fetching APIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiClick = (apiId) => {
    navigate(`/api/${apiId}`);
  };

  const handleRefresh = () => {
    fetchApis();
  };

  // Form handling functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'API name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'API name must be at least 3 characters';
    }
    
    if (formData.base_url && !isValidUrl(formData.base_url)) {
      errors.base_url = 'Please enter a valid URL';
    }
    
    if (!formData.version.trim()) {
      errors.version = 'Version is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      version: '1.0.0',
      status: 'development',
      base_url: '',
      tags: ''
    });
    setFormErrors({});
    setCreateError(null);
    setCreateSuccess(false);
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    
    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      const apiData = {
        ...formData,
        tags: tagsArray
      };
      
      const newApi = await createApi(apiData);
      
      // Show success message
      setCreateSuccess(true);
      
      // Refresh the API list
      await fetchApis();
      
      // Close form after a short delay
      setTimeout(() => {
        handleCloseCreateForm();
      }, 1500);
      
    } catch (err) {
      setCreateError(err.message || 'Failed to create API');
      console.error('Error creating API:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter and search logic
  const filteredApis = apis.filter((apiItem) => {
    const matchesSearch = apiItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apiItem.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || apiItem.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="api-list-container">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-list-container">
        <div className="error-state">
          <h2>Error Loading APIs</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-list-container">
      <div className="api-list-header">
        <h1>API Catalog</h1>
        <div className="header-actions">
          <button onClick={handleOpenCreateForm} className="btn-primary">
            + Create New API
          </button>
          <button onClick={handleRefresh} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Create API Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={handleCloseCreateForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New API</h2>
              <button 
                className="modal-close" 
                onClick={handleCloseCreateForm}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitCreate} className="create-api-form">
              {createError && (
                <div className="alert alert-error">
                  {createError}
                </div>
              )}
              
              {createSuccess && (
                <div className="alert alert-success">
                  API created successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">
                  API Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter API name"
                  className={formErrors.name ? 'input-error' : ''}
                  disabled={isCreating}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter API description"
                  rows="3"
                  disabled={isCreating}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="version">
                    Version <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    className={formErrors.version ? 'input-error' : ''}
                    disabled={isCreating}
                  />
                  {formErrors.version && (
                    <span className="error-message">{formErrors.version}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isCreating}
                  >
                    <option value="development">Development</option>
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="base_url">Base URL</label>
                <input
                  type="text"
                  id="base_url"
                  name="base_url"
                  value={formData.base_url}
                  onChange={handleInputChange}
                  placeholder="https://api.example.com"
                  className={formErrors.base_url ? 'input-error' : ''}
                  disabled={isCreating}
                />
                {formErrors.base_url && (
                  <span className="error-message">{formErrors.base_url}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas"
                  disabled={isCreating}
                />
                <small className="form-help">
                  Separate multiple tags with commas (e.g., REST, Public, v1)
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseCreateForm}
                  className="btn-secondary"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="api-list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search APIs by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>

      {filteredApis.length === 0 ? (
        <div className="empty-state">
          <h2>No APIs Found</h2>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by registering your first API'}
          </p>
        </div>
      ) : (
        <div className="api-grid">
          {filteredApis.map((apiItem) => (
            <div
              key={apiItem.id}
              className="api-card"
              onClick={() => handleApiClick(apiItem.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleApiClick(apiItem.id)}
            >
              <div className="api-card-header">
                <h3>{apiItem.name || 'Unnamed API'}</h3>
                <span className={`status-badge status-${apiItem.status || 'unknown'}`}>
                  {apiItem.status || 'Unknown'}
                </span>
              </div>
              
              <p className="api-description">
                {apiItem.description || 'No description available'}
              </p>
              
              <div className="api-meta">
                <span className="api-version">
                  v{apiItem.version || '1.0.0'}
                </span>
                <span className="api-endpoints">
                  {apiItem.endpoint_count || 0} endpoints
                </span>
              </div>
              
              {apiItem.updated_at && (
                <div className="api-updated">
                  Last updated: {new Date(apiItem.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="api-list-footer">
        <p>Total APIs: {filteredApis.length}</p>
      </div>
    </div>
  );
};

export default ApiList;
