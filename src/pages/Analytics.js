import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    apiUsage: {
      total: 125430,
      growth: 12.5,
      trend: 'up'
    },
    performance: {
      avgResponseTime: 245,
      uptime: 99.8,
      errorRate: 0.02
    },
    compliance: {
      score: 87,
      policies: 24,
      violations: 3
    },
    topApis: [
      { name: 'Payment API', calls: 45230, change: 8.5 },
      { name: 'User Service', calls: 32100, change: -2.3 },
      { name: 'Product Catalog', calls: 28900, change: 15.2 },
      { name: 'Order Processing', calls: 19200, change: 5.7 }
    ]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedMetric]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - In production, this would be from API
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality - In production, this would download a CSV/PDF report');
  };

  if (loading) {
    return <Loader text="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header Section */}
      <div className="analytics-header">
        <div className="analytics-title-section">
          <h1>Analytics Dashboard</h1>
          <p className="analytics-subtitle">API performance, usage metrics, and insights</p>
        </div>
        <div className="analytics-header-actions">
          <button 
            onClick={handleExport} 
            className="btn-secondary"
            title="Export analytics report"
          >
            📊 Export
          </button>
          <button 
            onClick={handleRefresh} 
            className="btn-primary"
            disabled={refreshing}
            title="Refresh data"
          >
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label htmlFor="date-range">Time Range:</label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="metric-filter">Metric:</label>
          <select
            id="metric-filter"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Metrics</option>
            <option value="usage">API Usage</option>
            <option value="performance">Performance</option>
            <option value="errors">Errors</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card kpi-primary">
          <div className="kpi-header">
            <span className="kpi-icon">📈</span>
            <span className={`kpi-trend trend-${analyticsData.apiUsage.trend}`}>
              {analyticsData.apiUsage.growth > 0 ? '↑' : '↓'} {Math.abs(analyticsData.apiUsage.growth)}%
            </span>
          </div>
          <div className="kpi-body">
            <h3 className="kpi-value">{analyticsData.apiUsage.total.toLocaleString()}</h3>
            <p className="kpi-label">Total API Calls</p>
          </div>
        </div>

        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <span className="kpi-icon">⚡</span>
            <span className="kpi-badge">Excellent</span>
          </div>
          <div className="kpi-body">
            <h3 className="kpi-value">{analyticsData.performance.avgResponseTime}ms</h3>
            <p className="kpi-label">Avg Response Time</p>
          </div>
        </div>

        <div className="kpi-card kpi-info">
          <div className="kpi-header">
            <span className="kpi-icon">🎯</span>
            <span className="kpi-badge">Good</span>
          </div>
          <div className="kpi-body">
            <h3 className="kpi-value">{analyticsData.performance.uptime}%</h3>
            <p className="kpi-label">Uptime</p>
          </div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <span className="kpi-icon">⚠️</span>
            <span className="kpi-badge">Monitor</span>
          </div>
          <div className="kpi-body">
            <h3 className="kpi-value">{analyticsData.performance.errorRate}%</h3>
            <p className="kpi-label">Error Rate</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        {/* API Usage Trend Chart */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3>API Usage Trend</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#2563eb' }}></span>
                API Calls
              </span>
            </div>
          </div>
          <div className="chart-body">
            <LineChartPlaceholder />
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="chart-card chart-medium">
          <div className="chart-header">
            <h3>Response Time Distribution</h3>
          </div>
          <div className="chart-body">
            <BarChartPlaceholder />
          </div>
        </div>

        {/* API Status Distribution */}
        <div className="chart-card chart-medium">
          <div className="chart-header">
            <h3>API Status Distribution</h3>
          </div>
          <div className="chart-body">
            <PieChartPlaceholder />
          </div>
        </div>

        {/* Error Rate Over Time */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3>Error Rate Over Time</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                Errors
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                Success
              </span>
            </div>
          </div>
          <div className="chart-body">
            <AreaChartPlaceholder />
          </div>
        </div>

        {/* Top APIs by Usage */}
        <div className="chart-card chart-medium">
          <div className="chart-header">
            <h3>Top APIs by Usage</h3>
          </div>
          <div className="chart-body">
            <div className="top-apis-list">
              {analyticsData.topApis.map((api, index) => (
                <div key={index} className="top-api-item">
                  <div className="api-rank">#{index + 1}</div>
                  <div className="api-info">
                    <div className="api-name">{api.name}</div>
                    <div className="api-calls">{api.calls.toLocaleString()} calls</div>
                  </div>
                  <div className={`api-change ${api.change >= 0 ? 'positive' : 'negative'}`}>
                    {api.change >= 0 ? '↑' : '↓'} {Math.abs(api.change)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="chart-card chart-medium">
          <div className="chart-header">
            <h3>Policy Compliance Score</h3>
          </div>
          <div className="chart-body">
            <GaugeChartPlaceholder score={analyticsData.compliance.score} />
          </div>
          <div className="chart-footer">
            <div className="compliance-stats">
              <div className="compliance-stat">
                <span className="stat-value">{analyticsData.compliance.policies}</span>
                <span className="stat-label">Active Policies</span>
              </div>
              <div className="compliance-stat">
                <span className="stat-value">{analyticsData.compliance.violations}</span>
                <span className="stat-label">Violations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3>Performance Metrics Comparison</h3>
          </div>
          <div className="chart-body">
            <HorizontalBarChartPlaceholder />
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="analytics-insights">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card insight-positive">
            <span className="insight-icon">✅</span>
            <div className="insight-content">
              <h4>Performance Improvement</h4>
              <p>API response times have decreased by 15% compared to last month</p>
            </div>
          </div>
          <div className="insight-card insight-warning">
            <span className="insight-icon">⚠️</span>
            <div className="insight-content">
              <h4>Compliance Alert</h4>
              <p>3 APIs are not meeting security policy requirements</p>
            </div>
          </div>
          <div className="insight-card insight-info">
            <span className="insight-icon">📊</span>
            <div className="insight-content">
              <h4>Usage Spike Detected</h4>
              <p>Payment API experienced 40% increase in traffic during peak hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart Placeholder Components

const LineChartPlaceholder = () => (
  <svg className="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
    {/* Grid lines */}
    <g className="grid-lines">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line
          key={i}
          x1="50"
          y1={50 + i * 50}
          x2="750"
          y2={50 + i * 50}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      ))}
    </g>
    
    {/* Y-axis labels */}
    <g className="axis-labels">
      {['25k', '20k', '15k', '10k', '5k', '0'].map((label, i) => (
        <text key={i} x="35" y={55 + i * 50} fontSize="12" fill="#64748b" textAnchor="end">
          {label}
        </text>
      ))}
    </g>
    
    {/* Line chart path */}
    <path
      d="M 50 200 L 150 180 L 250 140 L 350 160 L 450 100 L 550 120 L 650 80 L 750 90"
      stroke="#2563eb"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Area under line */}
    <path
      d="M 50 200 L 150 180 L 250 140 L 350 160 L 450 100 L 550 120 L 650 80 L 750 90 L 750 300 L 50 300 Z"
      fill="url(#lineGradient)"
      opacity="0.3"
    />
    
    {/* Data points */}
    {[[50, 200], [150, 180], [250, 140], [350, 160], [450, 100], [550, 120], [650, 80], [750, 90]].map((point, i) => (
      <circle key={i} cx={point[0]} cy={point[1]} r="5" fill="#2563eb" />
    ))}
    
    {/* X-axis labels */}
    <g className="x-axis-labels">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => (
        <text key={i} x={100 + i * 100} y="290" fontSize="12" fill="#64748b" textAnchor="middle">
          {label}
        </text>
      ))}
    </g>
    
    {/* Gradient definition */}
    <defs>
      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const BarChartPlaceholder = () => (
  <svg className="chart-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
    {/* Grid lines */}
    <g className="grid-lines">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line
          key={i}
          x1="50"
          y1={50 + i * 50}
          x2="370"
          y2={50 + i * 50}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      ))}
    </g>
    
    {/* Bars */}
    {[
      { x: 70, height: 180, label: '<100ms' },
      { x: 130, height: 220, label: '100-200ms' },
      { x: 190, height: 160, label: '200-300ms' },
      { x: 250, height: 100, label: '300-400ms' },
      { x: 310, height: 60, label: '>400ms' }
    ].map((bar, i) => (
      <g key={i}>
        <rect
          x={bar.x}
          y={300 - bar.height}
          width="40"
          height={bar.height}
          fill="#3b82f6"
          rx="4"
        />
        <text
          x={bar.x + 20}
          y="290"
          fontSize="11"
          fill="#64748b"
          textAnchor="middle"
        >
          {bar.label}
        </text>
      </g>
    ))}
    
    {/* Y-axis labels */}
    <g className="axis-labels">
      {['500', '400', '300', '200', '100', '0'].map((label, i) => (
        <text key={i} x="40" y={55 + i * 50} fontSize="12" fill="#64748b" textAnchor="end">
          {label}
        </text>
      ))}
    </g>
  </svg>
);

const PieChartPlaceholder = () => {
  const centerX = 200;
  const centerY = 150;
  const radius = 100;
  
  // Pie chart data: [percentage, color, label]
  const segments = [
    { percent: 42, color: '#10b981', label: 'Active' },
    { percent: 28, color: '#3b82f6', label: 'Development' },
    { percent: 18, color: '#f59e0b', label: 'Deprecated' },
    { percent: 12, color: '#ef4444', label: 'Inactive' }
  ];
  
  let currentAngle = -90;
  
  return (
    <svg className="chart-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
      {segments.map((segment, i) => {
        const startAngle = currentAngle;
        const angle = (segment.percent / 100) * 360;
        currentAngle += angle;
        const endAngle = currentAngle;
        
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
        return (
          <g key={i}>
            <path d={path} fill={segment.color} />
          </g>
        );
      })}
      
      {/* Center circle for donut effect */}
      <circle cx={centerX} cy={centerY} r="60" fill="white" />
      
      {/* Legend */}
      {segments.map((segment, i) => (
        <g key={i}>
          <rect
            x="320"
            y={60 + i * 30}
            width="12"
            height="12"
            fill={segment.color}
            rx="2"
          />
          <text x="340" y={70 + i * 30} fontSize="12" fill="#475569">
            {segment.label} ({segment.percent}%)
          </text>
        </g>
      ))}
    </svg>
  );
};

const AreaChartPlaceholder = () => (
  <svg className="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
    {/* Grid lines */}
    <g className="grid-lines">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line
          key={i}
          x1="50"
          y1={50 + i * 50}
          x2="750"
          y2={50 + i * 50}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      ))}
    </g>
    
    {/* Success area (green) */}
    <path
      d="M 50 280 L 150 270 L 250 275 L 350 272 L 450 278 L 550 274 L 650 276 L 750 273 L 750 300 L 50 300 Z"
      fill="#10b981"
      opacity="0.3"
    />
    <path
      d="M 50 280 L 150 270 L 250 275 L 350 272 L 450 278 L 550 274 L 650 276 L 750 273"
      stroke="#10b981"
      strokeWidth="2"
      fill="none"
    />
    
    {/* Error area (red) */}
    <path
      d="M 50 250 L 150 245 L 250 260 L 350 255 L 450 270 L 550 265 L 650 258 L 750 262 L 750 300 L 50 300 Z"
      fill="#ef4444"
      opacity="0.2"
    />
    <path
      d="M 50 250 L 150 245 L 250 260 L 350 255 L 450 270 L 550 265 L 650 258 L 750 262"
      stroke="#ef4444"
      strokeWidth="2"
      fill="none"
      strokeDasharray="5,5"
    />
    
    {/* X-axis labels */}
    <g className="x-axis-labels">
      {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label, i) => (
        <text key={i} x={150 + i * 200} y="290" fontSize="12" fill="#64748b" textAnchor="middle">
          {label}
        </text>
      ))}
    </g>
  </svg>
);

const GaugeChartPlaceholder = ({ score }) => {
  const radius = 80;
  const circumference = Math.PI * radius;
  const scorePercent = score / 100;
  const strokeDashoffset = circumference * (1 - scorePercent);
  
  let gaugeColor = '#10b981';
  if (score < 50) gaugeColor = '#ef4444';
  else if (score < 75) gaugeColor = '#f59e0b';
  
  return (
    <svg className="chart-svg gauge-chart" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet">
      {/* Background arc */}
      <path
        d="M 30 100 A 80 80 0 0 1 170 100"
        stroke="#e2e8f0"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Score arc */}
      <path
        d="M 30 100 A 80 80 0 0 1 170 100"
        stroke={gaugeColor}
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
      />
      
      {/* Score text */}
      <text x="100" y="95" fontSize="36" fontWeight="700" fill="#0f172a" textAnchor="middle">
        {score}
      </text>
      <text x="100" y="115" fontSize="14" fill="#64748b" textAnchor="middle">
        Compliance Score
      </text>
    </svg>
  );
};

const HorizontalBarChartPlaceholder = () => (
  <svg className="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
    {[
      { label: 'Payment API', value: 92, y: 50 },
      { label: 'User Service', value: 78, y: 100 },
      { label: 'Product Catalog', value: 85, y: 150 },
      { label: 'Order Processing', value: 88, y: 200 },
      { label: 'Notification Service', value: 95, y: 250 }
    ].map((bar, i) => (
      <g key={i}>
        {/* Label */}
        <text x="30" y={bar.y + 5} fontSize="14" fill="#475569" textAnchor="start">
          {bar.label}
        </text>
        
        {/* Background bar */}
        <rect
          x="200"
          y={bar.y - 12}
          width="550"
          height="24"
          fill="#f1f5f9"
          rx="4"
        />
        
        {/* Value bar */}
        <rect
          x="200"
          y={bar.y - 12}
          width={(bar.value / 100) * 550}
          height="24"
          fill={bar.value >= 90 ? '#10b981' : bar.value >= 75 ? '#3b82f6' : '#f59e0b'}
          rx="4"
        />
        
        {/* Value text */}
        <text
          x={200 + (bar.value / 100) * 550 + 10}
          y={bar.y + 5}
          fontSize="14"
          fontWeight="600"
          fill="#0f172a"
        >
          {bar.value}%
        </text>
      </g>
    ))}
  </svg>
);

export default Analytics;
