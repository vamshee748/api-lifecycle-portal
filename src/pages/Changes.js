import React, { useState, useEffect } from 'react';
import api from '../api';
import Loader from '../components/Loader';

const Changes = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/changes');
      setChanges(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch changes');
      console.error('Error fetching changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChanges = changes.filter((change) => {
    if (filterType === 'all') return true;
    return change.type === filterType;
  });

  if (loading) {
    return <Loader text="Loading change log..." />;
  }

  if (error) {
    return (
      <div className="changes-container">
        <div className="error-state">
          <h2>Error Loading Changes</h2>
          <p>{error}</p>
          <button onClick={fetchChanges} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="changes-container">
      <div className="changes-header">
        <h1>Change Log</h1>
        <p className="changes-subtitle">Track API modifications and updates</p>
      </div>

      <div className="changes-controls">
        <label htmlFor="change-filter">Filter by type:</label>
        <select
          id="change-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Changes</option>
          <option value="breaking">Breaking Changes</option>
          <option value="feature">New Features</option>
          <option value="deprecation">Deprecations</option>
          <option value="fix">Bug Fixes</option>
        </select>
      </div>

      {filteredChanges.length === 0 ? (
        <div className="empty-state">
          <h2>No Changes Found</h2>
          <p>No API changes have been recorded yet.</p>
        </div>
      ) : (
        <div className="changes-timeline">
          {filteredChanges.map((change, index) => (
            <div key={index} className="change-item">
              <div className="change-marker"></div>
              <div className="change-content">
                <h3>{change.title || 'Untitled Change'}</h3>
                <p className="change-description">
                  {change.description || 'No description available'}
                </p>
                <div className="change-meta">
                  <span className={`change-type type-${change.type || 'default'}`}>
                    {change.type || 'Update'}
                  </span>
                  {change.date && (
                    <span className="change-date">
                      {new Date(change.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Changes;