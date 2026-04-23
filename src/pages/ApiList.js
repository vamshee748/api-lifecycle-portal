import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const ApiList = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
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
        <button onClick={handleRefresh} className="btn-secondary">
          Refresh
        </button>
      </div>

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
