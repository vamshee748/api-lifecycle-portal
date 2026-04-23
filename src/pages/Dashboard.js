import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Loader from '../components/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalApis: 0,
    activeApis: 0,
    recentChanges: 0,
    deprecatedApis: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data for now - replace with actual API call
      // const response = await api.get('/api/v1/dashboard/stats');
      setTimeout(() => {
        setStats({
          totalApis: 45,
          activeApis: 38,
          recentChanges: 12,
          deprecatedApis: 7,
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">API Governance & Lifecycle Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🔌</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalApis}</h3>
            <p className="stat-label">Total APIs</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.activeApis}</h3>
            <p className="stat-label">Active APIs</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.recentChanges}</h3>
            <p className="stat-label">Recent Changes</p>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.deprecatedApis}</h3>
            <p className="stat-label">Deprecated APIs</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/apis" className="btn-primary">
          View All APIs
        </Link>
        <Link to="/changes" className="btn-secondary">
          View Change Log
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;