import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { createChange } from '../api';
import Loader from '../components/Loader';

const Changes = () => {
  const [changes, setChanges] = useState([]);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterApi, setFilterApi] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('timeline'); // timeline or list
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature',
    api_id: '',
    version: '',
    author: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both changes and APIs in parallel
      const [changesRes, apisRes] = await Promise.all([
        api.get('/api/v1/changes'),
        api.get('/api/v1/apis')
      ]);
      
      setChanges(changesRes.data || []);
      setApis(apisRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleApiClick = (apiId) => {
    if (apiId) {
      navigate(`/api/${apiId}`);
    }
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
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.type) {
      errors.type = 'Change type is required';
    }
    
    if (formData.version && !/^\d+\.\d+\.\d+$/.test(formData.version.trim())) {
      errors.version = 'Version must be in format X.Y.Z (e.g., 1.0.0)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'feature',
      api_id: '',
      version: '',
      author: ''
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
      const changePayload = {
        ...formData,
        date: new Date().toISOString()
      };
      
      await createChange(changePayload);
      
      // Show success message
      setCreateSuccess(true);
      
      // Refresh the changes list
      await fetchData();
      
      // Close form after a short delay
      setTimeout(() => {
        handleCloseCreateForm();
      }, 1500);
      
    } catch (err) {
      setCreateError(err.message || 'Failed to create change log');
      console.error('Error creating change:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Get change type icon
  const getChangeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'breaking':
        return '⚠️';
      case 'feature':
        return '✨';
      case 'deprecation':
        return '📛';
      case 'fix':
        return '🔧';
      case 'security':
        return '🔒';
      case 'performance':
        return '⚡';
      default:
        return '📝';
    }
  };

  // Filter and search logic
  const filteredChanges = changes.filter((change) => {
    // Filter by type
    const matchesType = filterType === 'all' || change.type?.toLowerCase() === filterType.toLowerCase();
    
    // Filter by API
    const matchesApi = filterApi === 'all' || change.api_id === filterApi;
    
    // Search in title, description, and API name
    const matchesSearch = !searchQuery || 
      change.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.api_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesApi && matchesSearch;
  });

  // Sort changes
  const sortedChanges = [...filteredChanges].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0).getTime();
    const dateB = new Date(b.date || b.created_at || 0).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Group changes by date for timeline view
  const groupedChanges = sortedChanges.reduce((groups, change) => {
    const date = change.date || change.created_at;
    const dateKey = date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'No Date';
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(change);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="changes-container">
        <Loader text="Loading change log..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="changes-container">
        <div className="error-state">
          <h2>Error Loading Changes</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="changes-container">
      <div className="changes-header">
        <div className="changes-title-section">
          <h1>Change Log</h1>
          <p className="changes-subtitle">Track API modifications, updates, and version history</p>
        </div>
        <div className="changes-header-actions">
          <button onClick={handleOpenCreateForm} className="btn-primary" title="Log new change">
            + Log Change
          </button>
          <button onClick={handleRefresh} className="btn-secondary" title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Create Change Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={handleCloseCreateForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log New Change</h2>
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
                  Change logged successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="change-title">
                  Change Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="change-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter change title"
                  className={formErrors.title ? 'input-error' : ''}
                  disabled={isCreating}
                />
                {formErrors.title && (
                  <span className="error-message">{formErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="change-description">Description</label>
                <textarea
                  id="change-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the change in detail"
                  rows="4"
                  disabled={isCreating}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="change-type">
                    Change Type <span className="required">*</span>
                  </label>
                  <select
                    id="change-type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={formErrors.type ? 'input-error' : ''}
                    disabled={isCreating}
                  >
                    <option value="feature">✨ New Feature</option>
                    <option value="breaking">⚠️ Breaking Change</option>
                    <option value="deprecation">📛 Deprecation</option>
                    <option value="fix">🔧 Bug Fix</option>
                    <option value="security">🔒 Security Update</option>
                    <option value="performance">⚡ Performance</option>
                  </select>
                  {formErrors.type && (
                    <span className="error-message">{formErrors.type}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="change-api">Related API</label>
                  <select
                    id="change-api"
                    name="api_id"
                    value={formData.api_id}
                    onChange={handleInputChange}
                    disabled={isCreating}
                  >
                    <option value="">None</option>
                    {apis.map((apiItem) => (
                      <option key={apiItem.id} value={apiItem.id}>
                        {apiItem.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="change-version">Version</label>
                  <input
                    type="text"
                    id="change-version"
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
                  <small className="form-help">
                    Format: X.Y.Z (e.g., 1.0.0)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="change-author">Author</label>
                  <input
                    type="text"
                    id="change-author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    disabled={isCreating}
                  />
                </div>
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
                  {isCreating ? 'Logging Change...' : 'Log Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="changes-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search changes by title, description, or API..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="breaking">Breaking Changes</option>
              <option value="feature">New Features</option>
              <option value="deprecation">Deprecations</option>
              <option value="fix">Bug Fixes</option>
              <option value="security">Security Updates</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="api-filter">API:</label>
            <select
              id="api-filter"
              value={filterApi}
              onChange={(e) => setFilterApi(e.target.value)}
              className="filter-select"
            >
              <option value="all">All APIs</option>
              {apis.map((apiItem) => (
                <option key={apiItem.id} value={apiItem.id}>
                  {apiItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="sort-order">Sort:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="view-mode">View:</label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="filter-select"
            >
              <option value="timeline">Timeline</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>
      </div>

      <div className="changes-stats">
        <div className="stat-item">
          <span className="stat-value">{changes.length}</span>
          <span className="stat-label">Total Changes</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{sortedChanges.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
      </div>

      {sortedChanges.length === 0 ? (
        <div className="empty-state">
          <h2>No Changes Found</h2>
          <p>
            {searchQuery || filterType !== 'all' || filterApi !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No API changes have been recorded yet.'}
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="changes-timeline">
          {Object.entries(groupedChanges).map(([date, dateChanges]) => (
            <div key={date} className="timeline-group">
              <div className="timeline-date-header">
                <h3>{date}</h3>
                <span className="change-count">{dateChanges.length} change{dateChanges.length !== 1 ? 's' : ''}</span>
              </div>
              {dateChanges.map((change, index) => (
                <div key={change.id || index} className="change-item">
                  <div className="change-marker">
                    <span className="marker-icon">{getChangeIcon(change.type)}</span>
                  </div>
                  <div className="change-content">
                    <div className="change-header-row">
                      <h4 className="change-title">{change.title || 'Untitled Change'}</h4>
                      <span className={`change-badge badge-${change.type?.toLowerCase() || 'default'}`}>
                        {change.type || 'Update'}
                      </span>
                    </div>
                    
                    <p className="change-description">
                      {change.description || 'No description available'}
                    </p>
                    
                    {change.api_name && (
                      <div className="change-api-link">
                        <button
                          className="api-link-btn"
                          onClick={() => handleApiClick(change.api_id)}
                          title={`View ${change.api_name}`}
                        >
                          📡 {change.api_name}
                        </button>
                        {change.version && (
                          <span className="change-version">v{change.version}</span>
                        )}
                      </div>
                    )}
                    
                    {change.author && (
                      <div className="change-footer">
                        <span className="change-author">By {change.author}</span>
                        {change.date && (
                          <span className="change-time">
                            {new Date(change.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="changes-list">
          <table className="changes-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>API</th>
                <th>Version</th>
                <th>Date</th>
                <th>Author</th>
              </tr>
            </thead>
            <tbody>
              {sortedChanges.map((change, index) => (
                <tr key={change.id || index} className="change-row">
                  <td>
                    <span className={`change-badge badge-${change.type?.toLowerCase() || 'default'}`}>
                      {getChangeIcon(change.type)} {change.type || 'Update'}
                    </span>
                  </td>
                  <td>
                    <div className="change-cell-title">
                      <strong>{change.title || 'Untitled Change'}</strong>
                      {change.description && (
                        <p className="change-cell-desc">{change.description}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    {change.api_name ? (
                      <button
                        className="api-link-btn-small"
                        onClick={() => handleApiClick(change.api_id)}
                      >
                        {change.api_name}
                      </button>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    {change.version ? (
                      <span className="version-badge">v{change.version}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {change.date || change.created_at ? (
                      <span className="date-text">
                        {new Date(change.date || change.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{change.author || <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Changes;