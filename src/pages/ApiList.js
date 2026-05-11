import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { createApi, updateApi, deleteApi } from '../api';
import Loader from '../components/Loader';
import useDebounce from '../hooks/useDebounce';
import { useLoader } from '../context/LoaderContext';

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
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editingApiId, setEditingApiId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingApiId, setDeletingApiId] = useState(null);
  const [deletingApiName, setDeletingApiName] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Global loader for critical operations
  const { showLoader, hideLoader } = useLoader();
  
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
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

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '↕'; // Both arrows when not sorted
    }
    return sortDirection === 'asc' ? '↑' : '↓';
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
      showLoader('Creating API...');
      
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
      hideLoader();
    }
  };

  // Edit form handlers
  const handleOpenEditForm = (apiItem) => {
    // Populate form with existing API data
    setFormData({
      name: apiItem.name || '',
      description: apiItem.description || '',
      version: apiItem.version || '1.0.0',
      status: apiItem.status || 'development',
      base_url: apiItem.base_url || '',
      tags: Array.isArray(apiItem.tags) ? apiItem.tags.join(', ') : ''
    });
    setEditingApiId(apiItem.id);
    setFormErrors({});
    setEditError(null);
    setEditSuccess(false);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    resetForm();
    setEditingApiId(null);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!editingApiId) {
      setEditError('No API selected for editing');
      return;
    }
    
    setIsEditing(true);
    setEditError(null);
    setEditSuccess(false);
    
    try {
      showLoader('Updating API...');
      
      // Convert tags string to array
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      const apiData = {
        ...formData,
        tags: tagsArray
      };
      
      await updateApi(editingApiId, apiData);
      
      // Show success message
      setEditSuccess(true);
      
      // Refresh the API list
      await fetchApis();
      
      // Close form after a short delay
      setTimeout(() => {
        handleCloseEditForm();
      }, 1500);
      
    } catch (err) {
      setEditError(err.message || 'Failed to update API');
      console.error('Error updating API:', err);
    } finally {
      setIsEditing(false);
      hideLoader();
    }
  };

  // Delete form handlers
  const handleOpenDeleteConfirm = (apiItem) => {
    setDeletingApiId(apiItem.id);
    setDeletingApiName(apiItem.name || 'this API');
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    if (!isDeleting) {
      setShowDeleteConfirm(false);
      setDeletingApiId(null);
      setDeletingApiName('');
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingApiId) {
      setDeleteError('No API selected for deletion');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      showLoader('Deleting API...');
      
      await deleteApi(deletingApiId);
      
      // Refresh the API list
      await fetchApis();
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setDeletingApiId(null);
      setDeletingApiName('');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete API';
      setDeleteError(errorMessage);
      console.error('Error deleting API:', err);
    } finally {
      setIsDeleting(false);
      hideLoader();
    }
  };

  // Filter and search logic with memoization for performance
  const filteredApis = useMemo(() => {
    return apis.filter((apiItem) => {
      const matchesSearch = apiItem.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           apiItem.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || apiItem.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [apis, debouncedSearchQuery, filterStatus]);

  // Sort the filtered APIs with memoization
  const sortedApis = useMemo(() => {
    return [...filteredApis].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Handle different data types
      if (sortField === 'updated_at' || sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [filteredApis, sortField, sortDirection]);

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

      {/* Edit API Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={handleCloseEditForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit API</h2>
              <button 
                className="modal-close" 
                onClick={handleCloseEditForm}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitEdit} className="create-api-form">
              {editError && (
                <div className="alert alert-error">
                  {editError}
                </div>
              )}
              
              {editSuccess && (
                <div className="alert alert-success">
                  API updated successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="edit-name">
                  API Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter API name"
                  className={formErrors.name ? 'input-error' : ''}
                  disabled={isEditing}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter API description"
                  rows="3"
                  disabled={isEditing}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-version">
                    Version <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    className={formErrors.version ? 'input-error' : ''}
                    disabled={isEditing}
                  />
                  {formErrors.version && (
                    <span className="error-message">{formErrors.version}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isEditing}
                  >
                    <option value="development">Development</option>
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-base_url">Base URL</label>
                <input
                  type="text"
                  id="edit-base_url"
                  name="base_url"
                  value={formData.base_url}
                  onChange={handleInputChange}
                  placeholder="https://api.example.com"
                  className={formErrors.base_url ? 'input-error' : ''}
                  disabled={isEditing}
                />
                {formErrors.base_url && (
                  <span className="error-message">{formErrors.base_url}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-tags">Tags</label>
                <input
                  type="text"
                  id="edit-tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas"
                  disabled={isEditing}
                />
                <small className="form-help">
                  Separate multiple tags with commas (e.g., REST, Public, v1)
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseEditForm}
                  className="btn-secondary"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isEditing}
                >
                  {isEditing ? 'Updating...' : 'Update API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleCloseDeleteConfirm}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="modal-close" 
                onClick={handleCloseDeleteConfirm}
                aria-label="Close"
                disabled={isDeleting}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-error">
                  {deleteError}
                </div>
              )}

              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <p className="warning-text">
                  Are you sure you want to delete <strong>{deletingApiName}</strong>?
                </p>
                <p className="warning-subtext">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseDeleteConfirm}
                  className="btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn-danger"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete API'}
                </button>
              </div>
            </div>
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
        <div className="table-container">
          <table className="api-table">
            <thead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? sortDirection : 'none'}
                >
                  <div className="th-content">
                    <span>Name</span>
                    <span className="sort-icon">{getSortIcon('name')}</span>
                  </div>
                </th>
                <th className="description-column">Description</th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('version')}
                  aria-sort={sortField === 'version' ? sortDirection : 'none'}
                >
                  <div className="th-content">
                    <span>Version</span>
                    <span className="sort-icon">{getSortIcon('version')}</span>
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('status')}
                  aria-sort={sortField === 'status' ? sortDirection : 'none'}
                >
                  <div className="th-content">
                    <span>Status</span>
                    <span className="sort-icon">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="text-center">Endpoints</th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('updated_at')}
                  aria-sort={sortField === 'updated_at' ? sortDirection : 'none'}
                >
                  <div className="th-content">
                    <span>Last Updated</span>
                    <span className="sort-icon">{getSortIcon('updated_at')}</span>
                  </div>
                </th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedApis.map((apiItem) => (
                <tr 
                  key={apiItem.id}
                  className="api-row"
                  onClick={() => handleApiClick(apiItem.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleApiClick(apiItem.id)}
                >
                  <td className="api-name" data-label="Name">
                    <strong>{apiItem.name || 'Unnamed API'}</strong>
                  </td>
                  <td className="api-description" data-label="Description">
                    {apiItem.description || 'No description available'}
                  </td>
                  <td className="api-version" data-label="Version">
                    v{apiItem.version || '1.0.0'}
                  </td>
                  <td className="api-status" data-label="Status">
                    <span className={`status-badge status-${apiItem.status || 'unknown'}`}>
                      {apiItem.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="text-center" data-label="Endpoints">
                    {apiItem.endpoint_count || 0}
                  </td>
                  <td className="api-date" data-label="Last Updated">
                    {apiItem.updated_at 
                      ? new Date(apiItem.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'
                    }
                  </td>
                  <td className="api-actions" data-label="Actions">
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditForm(apiItem);
                        }}
                        aria-label={`Edit ${apiItem.name}`}
                        title="Edit API"
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteConfirm(apiItem);
                        }}
                        aria-label={`Delete ${apiItem.name}`}
                        title="Delete API"
                      >
                        Delete
                      </button>
                      <button 
                        className="btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApiClick(apiItem.id);
                        }}
                        aria-label={`View ${apiItem.name}`}
                        title="View API details"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="api-list-footer">
        <p>
          Showing {sortedApis.length} of {apis.length} API{apis.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ApiList;
