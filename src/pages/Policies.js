import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { validatePolicy, getAllPolicyValidations, getPolicyValidation, validateAllPolicies, getValidationSummary } from '../api';
import Loader from '../components/Loader';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  
  // Validation state
  const [validationStatus, setValidationStatus] = useState({});
  const [validationSummary, setValidationSummary] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [autoRefreshValidation, setAutoRefreshValidation] = useState(false);
  
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState(null);
  const [deletingPolicyName, setDeletingPolicyName] = useState('');
  
  // View details state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'security',
    status: 'active',
    enforcement_level: 'mandatory',
    rules: '',
    tags: '',
    owner: '',
    effective_date: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicies();
    fetchValidationData();
  }, []);

  // Auto-refresh validation data every 30 seconds if enabled
  useEffect(() => {
    if (autoRefreshValidation) {
      const interval = setInterval(() => {
        fetchValidationData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshValidation]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/policies');
      setPolicies(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch policies');
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch validation data for all policies
  const fetchValidationData = async () => {
    try {
      setValidationError(null);
      
      // Fetch validation status for all policies
      const [validationsResponse, summaryResponse] = await Promise.allSettled([
        getAllPolicyValidations(),
        getValidationSummary()
      ]);

      if (validationsResponse.status === 'fulfilled') {
        // Convert array to object keyed by policy ID for easy lookup
        const validationMap = {};
        if (Array.isArray(validationsResponse.value)) {
          validationsResponse.value.forEach(validation => {
            if (validation.policy_id) {
              validationMap[validation.policy_id] = validation;
            }
          });
        }
        setValidationStatus(validationMap);
      }

      if (summaryResponse.status === 'fulfilled') {
        setValidationSummary(summaryResponse.value);
      }
    } catch (err) {
      console.error('Error fetching validation data:', err);
      setValidationError('Failed to load validation status');
    }
  };

  // Validate a single policy
  const handleValidatePolicy = async (policyId) => {
    try {
      setIsValidating(true);
      setValidationError(null);
      
      const result = await validatePolicy(policyId);
      
      // Update validation status for this policy
      setValidationStatus(prev => ({
        ...prev,
        [policyId]: result
      }));
      
      // Refresh summary
      await fetchValidationData();
      
    } catch (err) {
      console.error('Error validating policy:', err);
      setValidationError(err.message || 'Failed to validate policy');
    } finally {
      setIsValidating(false);
    }
  };

  // Validate all policies
  const handleValidateAll = async () => {
    try {
      setIsValidating(true);
      setValidationError(null);
      
      await validateAllPolicies();
      
      // Refresh all validation data
      await fetchValidationData();
      
    } catch (err) {
      console.error('Error validating all policies:', err);
      setValidationError(err.message || 'Failed to validate all policies');
    } finally {
      setIsValidating(false);
    }
  };

  // Show detailed validation results
  const handleShowValidationDetails = async (policy) => {
    try {
      setValidationError(null);
      const validation = await getPolicyValidation(policy.id);
      setSelectedValidation({
        policy,
        validation
      });
      setShowValidationModal(true);
    } catch (err) {
      console.error('Error fetching validation details:', err);
      setValidationError('Failed to load validation details');
    }
  };

  const handleCloseValidationModal = () => {
    setShowValidationModal(false);
    setSelectedValidation(null);
  };

  // Get validation status badge for a policy
  const getValidationBadge = (policyId) => {
    const validation = validationStatus[policyId];
    
    if (!validation) {
      return {
        label: 'Not Validated',
        className: 'validation-not-checked',
        icon: '⚪'
      };
    }

    const complianceRate = validation.compliance_rate || 0;
    
    if (complianceRate >= 90) {
      return {
        label: 'Excellent',
        className: 'validation-excellent',
        icon: '✅',
        rate: complianceRate
      };
    } else if (complianceRate >= 70) {
      return {
        label: 'Good',
        className: 'validation-good',
        icon: '✔️',
        rate: complianceRate
      };
    } else if (complianceRate >= 50) {
      return {
        label: 'Warning',
        className: 'validation-warning',
        icon: '⚠️',
        rate: complianceRate
      };
    } else {
      return {
        label: 'Critical',
        className: 'validation-critical',
        icon: '❌',
        rate: complianceRate
      };
    }
  };

  const handleRefresh = () => {
    fetchPolicies();
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '↕';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      errors.name = 'Policy name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Policy name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.enforcement_level) {
      errors.enforcement_level = 'Enforcement level is required';
    }
    
    if (formData.effective_date) {
      const selectedDate = new Date(formData.effective_date);
      if (isNaN(selectedDate.getTime())) {
        errors.effective_date = 'Invalid date format';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'security',
      status: 'active',
      enforcement_level: 'mandatory',
      rules: '',
      tags: '',
      owner: '',
      effective_date: ''
    });
    setFormErrors({});
    setCreateError(null);
    setCreateSuccess(false);
    setEditError(null);
    setEditSuccess(false);
  };

  // Create handlers
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
      const policyPayload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        rules: formData.rules ? formData.rules.split('\n').filter(line => line.trim()) : []
      };
      
      await api.post('/api/v1/policies', policyPayload);
      
      setCreateSuccess(true);
      await fetchPolicies();
      
      setTimeout(() => {
        handleCloseCreateForm();
      }, 1500);
      
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create policy');
      console.error('Error creating policy:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Edit handlers
  const handleOpenEditForm = (policy) => {
    setFormData({
      name: policy.name || '',
      description: policy.description || '',
      category: policy.category || 'security',
      status: policy.status || 'active',
      enforcement_level: policy.enforcement_level || 'mandatory',
      rules: Array.isArray(policy.rules) ? policy.rules.join('\n') : '',
      tags: Array.isArray(policy.tags) ? policy.tags.join(', ') : '',
      owner: policy.owner || '',
      effective_date: policy.effective_date ? policy.effective_date.split('T')[0] : ''
    });
    setEditingPolicyId(policy.id);
    setShowEditForm(true);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingPolicyId(null);
    resetForm();
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsEditing(true);
    setEditError(null);
    setEditSuccess(false);
    
    try {
      const policyPayload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        rules: formData.rules ? formData.rules.split('\n').filter(line => line.trim()) : []
      };
      
      await api.put(`/api/v1/policies/${editingPolicyId}`, policyPayload);
      
      setEditSuccess(true);
      await fetchPolicies();
      
      setTimeout(() => {
        handleCloseEditForm();
      }, 1500);
      
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update policy');
      console.error('Error updating policy:', err);
    } finally {
      setIsEditing(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (policy) => {
    setDeletingPolicyId(policy.id);
    setDeletingPolicyName(policy.name);
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingPolicyId(null);
    setDeletingPolicyName('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await api.delete(`/api/v1/policies/${deletingPolicyId}`);
      await fetchPolicies();
      handleCloseDeleteConfirm();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete policy');
      console.error('Error deleting policy:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // View details handlers
  const handleViewPolicy = (policy) => {
    setViewingPolicy(policy);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingPolicy(null);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'security':
        return '🔒';
      case 'compliance':
        return '✅';
      case 'performance':
        return '⚡';
      case 'governance':
        return '⚖️';
      case 'quality':
        return '⭐';
      case 'documentation':
        return '📚';
      default:
        return '📋';
    }
  };

  // Get enforcement level badge color
  const getEnforcementClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'mandatory':
        return 'enforcement-mandatory';
      case 'recommended':
        return 'enforcement-recommended';
      case 'optional':
        return 'enforcement-optional';
      default:
        return 'enforcement-default';
    }
  };

  // Get status badge color
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'draft':
        return 'status-draft';
      case 'deprecated':
        return 'status-deprecated';
      default:
        return 'status-default';
    }
  };

  // Filter and search logic
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = !searchQuery || 
      policy.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.owner?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || policy.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === 'all' || policy.status?.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort policies
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue ? bValue.toLowerCase() : '';
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="policies-container">
        <Loader text="Loading policies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="policies-container">
        <div className="error-state">
          <h2>Error Loading Policies</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="policies-container">
      <div className="policies-header">
        <div className="policies-title-section">
          <h1>API Policies</h1>
          <p className="policies-subtitle">Manage governance policies, rules, and compliance standards</p>
        </div>
        <div className="policies-header-actions">
          <button onClick={handleOpenCreateForm} className="btn-primary" title="Create new policy">
            + Create Policy
          </button>
          <button onClick={handleRefresh} className="btn-secondary" title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Validation Dashboard */}
      <div className="validation-dashboard">
        <div className="validation-dashboard-header">
          <h2>Policy Validation Status</h2>
          <div className="validation-actions">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefreshValidation}
                onChange={(e) => setAutoRefreshValidation(e.target.checked)}
              />
              <span>Auto-refresh</span>
            </label>
            <button 
              onClick={handleValidateAll} 
              className="btn-primary"
              disabled={isValidating}
              title="Validate all policies"
            >
              {isValidating ? '⏳ Validating...' : '🔍 Validate All'}
            </button>
            <button 
              onClick={fetchValidationData} 
              className="btn-secondary"
              title="Refresh validation data"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {validationError && (
          <div className="alert alert-error">
            {validationError}
          </div>
        )}

        {validationSummary && (
          <div className="validation-summary-grid">
            <div className="validation-summary-card">
              <div className="summary-icon excellent">✅</div>
              <div className="summary-content">
                <div className="summary-value">{validationSummary.total_policies || 0}</div>
                <div className="summary-label">Total Policies</div>
              </div>
            </div>
            
            <div className="validation-summary-card">
              <div className="summary-icon good">✔️</div>
              <div className="summary-content">
                <div className="summary-value">{validationSummary.validated_policies || 0}</div>
                <div className="summary-label">Validated</div>
              </div>
            </div>
            
            <div className="validation-summary-card">
              <div className="summary-icon warning">⚠️</div>
              <div className="summary-content">
                <div className="summary-value">{validationSummary.policies_with_issues || 0}</div>
                <div className="summary-label">With Issues</div>
              </div>
            </div>
            
            <div className="validation-summary-card">
              <div className="summary-icon">
                <div className="summary-progress-ring">
                  <svg width="50" height="50">
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke={
                        validationSummary.average_compliance >= 90 ? '#10b981' :
                        validationSummary.average_compliance >= 70 ? '#3b82f6' :
                        validationSummary.average_compliance >= 50 ? '#f59e0b' : '#ef4444'
                      }
                      strokeWidth="4"
                      strokeDasharray={`${(validationSummary.average_compliance || 0) * 1.257} 125.7`}
                      strokeDashoffset="0"
                      transform="rotate(-90 25 25)"
                    />
                  </svg>
                  <div className="progress-text">
                    {Math.round(validationSummary.average_compliance || 0)}%
                  </div>
                </div>
              </div>
              <div className="summary-content">
                <div className="summary-label">Avg. Compliance</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Details Modal */}
      {showValidationModal && selectedValidation && (
        <div className="modal-overlay" onClick={handleCloseValidationModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Validation Results: {selectedValidation.policy.name}</h2>
              <button 
                className="modal-close" 
                onClick={handleCloseValidationModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="validation-details-view">
              <div className="validation-overview">
                <div className="validation-score-card">
                  <div className="score-circle">
                    <svg width="120" height="120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={
                          selectedValidation.validation.compliance_rate >= 90 ? '#10b981' :
                          selectedValidation.validation.compliance_rate >= 70 ? '#3b82f6' :
                          selectedValidation.validation.compliance_rate >= 50 ? '#f59e0b' : '#ef4444'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${(selectedValidation.validation.compliance_rate || 0) * 3.14} 314`}
                        strokeDashoffset="0"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="score-text">
                      <div className="score-value">
                        {Math.round(selectedValidation.validation.compliance_rate || 0)}%
                      </div>
                      <div className="score-label">Compliance</div>
                    </div>
                  </div>
                </div>

                <div className="validation-stats">
                  <div className="stat-box">
                    <div className="stat-icon compliant">✅</div>
                    <div className="stat-info">
                      <div className="stat-number">{selectedValidation.validation.compliant_apis || 0}</div>
                      <div className="stat-text">Compliant APIs</div>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon non-compliant">❌</div>
                    <div className="stat-info">
                      <div className="stat-number">{selectedValidation.validation.non_compliant_apis || 0}</div>
                      <div className="stat-text">Non-compliant APIs</div>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon total">📊</div>
                    <div className="stat-info">
                      <div className="stat-number">{selectedValidation.validation.total_apis_checked || 0}</div>
                      <div className="stat-text">Total APIs Checked</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedValidation.validation.violations && selectedValidation.validation.violations.length > 0 && (
                <div className="validation-section">
                  <h3>Policy Violations</h3>
                  <div className="violations-list">
                    {selectedValidation.validation.violations.map((violation, index) => (
                      <div key={index} className="violation-item">
                        <div className="violation-header">
                          <span className="violation-severity severity-{violation.severity || 'medium'}">
                            {violation.severity === 'high' ? '🔴' : violation.severity === 'medium' ? '🟡' : '🟢'}
                            {violation.severity || 'medium'}
                          </span>
                          <span className="violation-api">{violation.api_name}</span>
                        </div>
                        <div className="violation-description">
                          {violation.description || violation.message}
                        </div>
                        {violation.rule && (
                          <div className="violation-rule">
                            Rule: {violation.rule}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedValidation.validation.recommendations && selectedValidation.validation.recommendations.length > 0 && (
                <div className="validation-section">
                  <h3>Recommendations</h3>
                  <ul className="recommendations-list">
                    {selectedValidation.validation.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="validation-meta">
                <div className="meta-item">
                  <span className="meta-label">Last Validated:</span>
                  <span className="meta-value">
                    {selectedValidation.validation.validated_at 
                      ? new Date(selectedValidation.validation.validated_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Validation Duration:</span>
                  <span className="meta-value">
                    {selectedValidation.validation.duration 
                      ? `${selectedValidation.validation.duration}ms`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCloseValidationModal}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCloseValidationModal();
                  handleValidatePolicy(selectedValidation.policy.id);
                }}
                className="btn-primary"
              >
                Re-validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={handleCloseCreateForm}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Policy</h2>
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
                  Policy created successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="policy-name">
                  Policy Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="policy-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter policy name"
                  className={formErrors.name ? 'input-error' : ''}
                  disabled={isCreating}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="policy-description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="policy-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the policy purpose and scope"
                  rows="3"
                  className={formErrors.description ? 'input-error' : ''}
                  disabled={isCreating}
                />
                {formErrors.description && (
                  <span className="error-message">{formErrors.description}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="policy-category">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="policy-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={formErrors.category ? 'input-error' : ''}
                    disabled={isCreating}
                  >
                    <option value="security">🔒 Security</option>
                    <option value="compliance">✅ Compliance</option>
                    <option value="performance">⚡ Performance</option>
                    <option value="governance">⚖️ Governance</option>
                    <option value="quality">⭐ Quality</option>
                    <option value="documentation">📚 Documentation</option>
                  </select>
                  {formErrors.category && (
                    <span className="error-message">{formErrors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="policy-status">Status</label>
                  <select
                    id="policy-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isCreating}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="policy-enforcement">
                    Enforcement Level <span className="required">*</span>
                  </label>
                  <select
                    id="policy-enforcement"
                    name="enforcement_level"
                    value={formData.enforcement_level}
                    onChange={handleInputChange}
                    className={formErrors.enforcement_level ? 'input-error' : ''}
                    disabled={isCreating}
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                  {formErrors.enforcement_level && (
                    <span className="error-message">{formErrors.enforcement_level}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="policy-owner">Policy Owner</label>
                  <input
                    type="text"
                    id="policy-owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    placeholder="Owner name or team"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="policy-rules">Rules (one per line)</label>
                <textarea
                  id="policy-rules"
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Enter policy rules, one per line&#10;Example:&#10;All APIs must use HTTPS&#10;Rate limiting must be implemented&#10;API keys must rotate every 90 days"
                  rows="5"
                  disabled={isCreating}
                />
                <small className="form-help">
                  Enter each rule on a separate line
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="policy-tags">Tags (comma-separated)</label>
                  <input
                    type="text"
                    id="policy-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="security, rest, authentication"
                    disabled={isCreating}
                  />
                  <small className="form-help">
                    Separate tags with commas
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="policy-effective-date">Effective Date</label>
                  <input
                    type="date"
                    id="policy-effective-date"
                    name="effective_date"
                    value={formData.effective_date}
                    onChange={handleInputChange}
                    className={formErrors.effective_date ? 'input-error' : ''}
                    disabled={isCreating}
                  />
                  {formErrors.effective_date && (
                    <span className="error-message">{formErrors.effective_date}</span>
                  )}
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
                  {isCreating ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={handleCloseEditForm}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Policy</h2>
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
                  Policy updated successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="edit-policy-name">
                  Policy Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="edit-policy-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter policy name"
                  className={formErrors.name ? 'input-error' : ''}
                  disabled={isEditing}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-policy-description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="edit-policy-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the policy purpose and scope"
                  rows="3"
                  className={formErrors.description ? 'input-error' : ''}
                  disabled={isEditing}
                />
                {formErrors.description && (
                  <span className="error-message">{formErrors.description}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-policy-category">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="edit-policy-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={formErrors.category ? 'input-error' : ''}
                    disabled={isEditing}
                  >
                    <option value="security">🔒 Security</option>
                    <option value="compliance">✅ Compliance</option>
                    <option value="performance">⚡ Performance</option>
                    <option value="governance">⚖️ Governance</option>
                    <option value="quality">⭐ Quality</option>
                    <option value="documentation">📚 Documentation</option>
                  </select>
                  {formErrors.category && (
                    <span className="error-message">{formErrors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-policy-status">Status</label>
                  <select
                    id="edit-policy-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isEditing}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-policy-enforcement">
                    Enforcement Level <span className="required">*</span>
                  </label>
                  <select
                    id="edit-policy-enforcement"
                    name="enforcement_level"
                    value={formData.enforcement_level}
                    onChange={handleInputChange}
                    className={formErrors.enforcement_level ? 'input-error' : ''}
                    disabled={isEditing}
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                  {formErrors.enforcement_level && (
                    <span className="error-message">{formErrors.enforcement_level}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-policy-owner">Policy Owner</label>
                  <input
                    type="text"
                    id="edit-policy-owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    placeholder="Owner name or team"
                    disabled={isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-policy-rules">Rules (one per line)</label>
                <textarea
                  id="edit-policy-rules"
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Enter policy rules, one per line"
                  rows="5"
                  disabled={isEditing}
                />
                <small className="form-help">
                  Enter each rule on a separate line
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-policy-tags">Tags (comma-separated)</label>
                  <input
                    type="text"
                    id="edit-policy-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="security, rest, authentication"
                    disabled={isEditing}
                  />
                  <small className="form-help">
                    Separate tags with commas
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-policy-effective-date">Effective Date</label>
                  <input
                    type="date"
                    id="edit-policy-effective-date"
                    name="effective_date"
                    value={formData.effective_date}
                    onChange={handleInputChange}
                    className={formErrors.effective_date ? 'input-error' : ''}
                    disabled={isEditing}
                  />
                  {formErrors.effective_date && (
                    <span className="error-message">{formErrors.effective_date}</span>
                  )}
                </div>
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
                  {isEditing ? 'Updating...' : 'Update Policy'}
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
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {deleteError}
                </div>
              )}
              
              <p>Are you sure you want to delete the policy:</p>
              <p className="delete-confirmation-name">
                <strong>{deletingPolicyName}</strong>
              </p>
              <p className="delete-warning">
                This action cannot be undone.
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
                {isDeleting ? 'Deleting...' : 'Delete Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Policy Details Modal */}
      {showViewModal && viewingPolicy && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewingPolicy.name}</h2>
              <button 
                className="modal-close" 
                onClick={handleCloseViewModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="policy-details-view">
              <div className="policy-details-header">
                <div className="policy-badges">
                  <span className={`policy-badge ${getStatusClass(viewingPolicy.status)}`}>
                    {viewingPolicy.status || 'Unknown'}
                  </span>
                  <span className={`policy-badge ${getEnforcementClass(viewingPolicy.enforcement_level)}`}>
                    {viewingPolicy.enforcement_level || 'Optional'}
                  </span>
                  <span className="policy-badge policy-category">
                    {getCategoryIcon(viewingPolicy.category)} {viewingPolicy.category || 'General'}
                  </span>
                </div>
              </div>

              <div className="policy-details-section">
                <h3>Description</h3>
                <p>{viewingPolicy.description || 'No description available'}</p>
              </div>

              {viewingPolicy.rules && viewingPolicy.rules.length > 0 && (
                <div className="policy-details-section">
                  <h3>Rules</h3>
                  <ul className="policy-rules-list">
                    {viewingPolicy.rules.map((rule, index) => (
                      <li key={index}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="policy-details-section">
                <h3>Details</h3>
                <div className="policy-meta-grid">
                  {viewingPolicy.owner && (
                    <div className="policy-meta-item">
                      <span className="meta-label">Owner:</span>
                      <span className="meta-value">{viewingPolicy.owner}</span>
                    </div>
                  )}
                  {viewingPolicy.effective_date && (
                    <div className="policy-meta-item">
                      <span className="meta-label">Effective Date:</span>
                      <span className="meta-value">
                        {new Date(viewingPolicy.effective_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viewingPolicy.created_at && (
                    <div className="policy-meta-item">
                      <span className="meta-label">Created:</span>
                      <span className="meta-value">
                        {new Date(viewingPolicy.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viewingPolicy.updated_at && (
                    <div className="policy-meta-item">
                      <span className="meta-label">Last Updated:</span>
                      <span className="meta-value">
                        {new Date(viewingPolicy.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {viewingPolicy.tags && viewingPolicy.tags.length > 0 && (
                <div className="policy-details-section">
                  <h3>Tags</h3>
                  <div className="policy-tags">
                    {viewingPolicy.tags.map((tag, index) => (
                      <span key={index} className="policy-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseViewModal}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseViewModal();
                    handleOpenEditForm(viewingPolicy);
                  }}
                  className="btn-primary"
                >
                  Edit Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="policies-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search policies by name, description, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="category-filter">Category:</label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="security">Security</option>
              <option value="compliance">Compliance</option>
              <option value="performance">Performance</option>
              <option value="governance">Governance</option>
              <option value="quality">Quality</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
              <option value="deprecated">Deprecated</option>
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
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>
      </div>

      <div className="policies-stats">
        <div className="stat-item">
          <span className="stat-value">{policies.length}</span>
          <span className="stat-label">Total Policies</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{sortedPolicies.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {policies.filter(p => p.status?.toLowerCase() === 'active').length}
          </span>
          <span className="stat-label">Active Policies</span>
        </div>
      </div>

      {sortedPolicies.length === 0 ? (
        <div className="empty-state">
          <h2>No Policies Found</h2>
          <p>
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No policies have been created yet. Click "Create Policy" to add your first policy.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="policies-grid">
          {sortedPolicies.map((policy) => {
            const validationBadge = getValidationBadge(policy.id);
            return (
            <div key={policy.id} className="policy-card">
              <div className="policy-card-header">
                <div className="policy-icon">
                  {getCategoryIcon(policy.category)}
                </div>
                <div className="policy-card-badges">
                  <span className={`policy-badge ${getStatusClass(policy.status)}`}>
                    {policy.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="policy-card-body">
                <h3 className="policy-card-title">{policy.name}</h3>
                <p className="policy-card-description">
                  {policy.description || 'No description available'}
                </p>
                
                <div className="policy-card-meta">
                  <span className={`enforcement-badge ${getEnforcementClass(policy.enforcement_level)}`}>
                    {policy.enforcement_level || 'Optional'}
                  </span>
                  <span className="policy-category-badge">
                    {policy.category || 'General'}
                  </span>
                </div>

                {/* Validation Status */}
                <div className={`validation-status-badge ${validationBadge.className}`}>
                  <span className="validation-icon">{validationBadge.icon}</span>
                  <span className="validation-label">{validationBadge.label}</span>
                  {validationBadge.rate !== undefined && (
                    <span className="validation-rate">{Math.round(validationBadge.rate)}%</span>
                  )}
                </div>

                {policy.tags && policy.tags.length > 0 && (
                  <div className="policy-card-tags">
                    {policy.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="policy-tag-small">{tag}</span>
                    ))}
                    {policy.tags.length > 3 && (
                      <span className="policy-tag-more">+{policy.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="policy-card-footer">
                <button 
                  className="btn-text"
                  onClick={() => handleViewPolicy(policy)}
                  title="View details"
                >
                  View
                </button>
                <button 
                  className="btn-text"
                  onClick={() => handleShowValidationDetails(policy)}
                  title="View validation results"
                >
                  Validation
                </button>
                <button 
                  className="btn-text"
                  onClick={() => handleValidatePolicy(policy.id)}
                  title="Validate policy"
                  disabled={isValidating}
                >
                  {isValidating ? '...' : 'Check'}
                </button>
                <button 
                  className="btn-text"
                  onClick={() => handleOpenEditForm(policy)}
                  title="Edit policy"
                >
                  Edit
                </button>
                <button 
                  className="btn-text btn-text-danger"
                  onClick={() => handleOpenDeleteConfirm(policy)}
                  title="Delete policy"
                >
                  Delete
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="policies-list">
          <table className="policies-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {getSortIcon('name')}
                </th>
                <th>Category</th>
                <th>Enforcement</th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status {getSortIcon('status')}
                </th>
                <th>Validation</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPolicies.map((policy) => {
                const validationBadge = getValidationBadge(policy.id);
                return (
                <tr key={policy.id} className="policy-row">
                  <td>
                    <div className="policy-cell-name">
                      <strong>{policy.name}</strong>
                      {policy.description && (
                        <p className="policy-cell-desc">{policy.description}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="policy-category-badge">
                      {getCategoryIcon(policy.category)} {policy.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <span className={`enforcement-badge ${getEnforcementClass(policy.enforcement_level)}`}>
                      {policy.enforcement_level || 'Optional'}
                    </span>
                  </td>
                  <td>
                    <span className={`policy-badge ${getStatusClass(policy.status)}`}>
                      {policy.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div 
                      className={`validation-status-inline ${validationBadge.className}`}
                      onClick={() => handleShowValidationDetails(policy)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view details"
                    >
                      <span className="validation-icon">{validationBadge.icon}</span>
                      <span className="validation-label">{validationBadge.label}</span>
                      {validationBadge.rate !== undefined && (
                        <span className="validation-rate">{Math.round(validationBadge.rate)}%</span>
                      )}
                    </div>
                  </td>
                  <td>{policy.owner || <span className="text-muted">—</span>}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleViewPolicy(policy)}
                        title="View details"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleValidatePolicy(policy.id)}
                        title="Validate policy"
                        disabled={isValidating}
                      >
                        🔍
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleOpenEditForm(policy)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        onClick={() => handleOpenDeleteConfirm(policy)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Policies;
