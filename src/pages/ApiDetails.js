import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const ApiDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApiDetails();
  }, [id]);

  const fetchApiDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/v1/apis/${id}`);
      setApiData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch API details');
      console.error('Error fetching API details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading API details..." />;
  }

  if (error) {
    return (
      <div className="api-details-container">
        <div className="error-state">
          <h2>Error Loading API Details</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/apis')} className="btn-primary">
            Back to API List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-details-container">
      <div className="api-details-header">
        <button onClick={() => navigate('/apis')} className="btn-back">
          ← Back to APIs
        </button>
        <h1>{apiData?.name || `API ${id}`}</h1>
        <span className={`status-badge status-${apiData?.status || 'unknown'}`}>
          {apiData?.status || 'Unknown'}
        </span>
      </div>

      <div className="api-details-content">
        <div className="details-section">
          <h2>Overview</h2>
          <p>{apiData?.description || 'No description available'}</p>
        </div>

        <div className="details-section">
          <h2>API Information</h2>
          <dl className="details-list">
            <dt>Version:</dt>
            <dd>{apiData?.version || 'N/A'}</dd>
            <dt>Base URL:</dt>
            <dd><code>{apiData?.base_url || 'N/A'}</code></dd>
            <dt>Endpoints:</dt>
            <dd>{apiData?.endpoint_count || 0}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ApiDetails;