import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function FormReviewModal({ form, onClose }) {
    // Form data state
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [formError, setFormError] = useState(null);
    
    // Add API error state
    const [apiError, setApiError] = useState(null);
    
    // Status panel state variables
    const [selectedStatus, setSelectedStatus] = useState(form.status || 'Pending Review');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStatusError, setShowStatusError] = useState(false);
    // Add this state at the top of your component with other state variables
    const [responseDebug, setResponseDebug] = useState(null);
    // Issues state
    const [issues, setIssues] = useState([]);
    const [issueDescription, setIssueDescription] = useState('');
    const [issueSeverity, setIssueSeverity] = useState('');
    const [issueDueDate, setIssueDueDate] = useState(null);
    const [issueErrors, setIssueErrors] = useState({});
    
    // Edit issue state
    const [editingIssue, setEditingIssue] = useState(null);
    const [editIssueDescription, setEditIssueDescription] = useState('');
    const [editIssueSeverity, setEditIssueSeverity] = useState('');
    const [editIssueDueDate, setEditIssueDueDate] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteIssueId, setDeleteIssueId] = useState(null);

    // Add this state variable at the top with your other state variables
const [issueVersion, setIssueVersion] = useState('current');

    // Add another state variable
const [issuesLoading, setIssuesLoading] = useState(false);

    // Add these with your other state variables
const [expandedIssues, setExpandedIssues] = useState({});
const [correctiveActions, setCorrectiveActions] = useState({});
const [loadingCorrectiveActions, setLoadingCorrectiveActions] = useState({});

    // Add this state variable with your other state variables
const [correctiveActionCounts, setCorrectiveActionCounts] = useState({});

    // AI Analysis state
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    // Determine if issue fields are required based on selected status
    const isRejected = selectedStatus === 'Rejected';
    
    // Reset error when status or issue details change
    useEffect(() => {
        setShowStatusError(false);
        setApiError(null); // Clear API errors when inputs change
        
        // Reset issue fields when status changes away from Rejected
        if (!isRejected) {
            setIssueErrors({});
        }
    }, [selectedStatus, issueDescription, issueSeverity, issueDueDate]);
    // Function to start editing an issue
const startEditIssue = (issue) => {
    setEditingIssue(issue);
    setEditIssueDescription(issue.description);
    setEditIssueSeverity(issue.severity);
    setEditIssueDueDate(issue.due_date ? new Date(issue.due_date) : null);
};

// Function to cancel editing
const cancelEditIssue = () => {
    setEditingIssue(null);
    setEditIssueDescription('');
    setEditIssueSeverity('');
    setEditIssueDueDate(null);
};

// Function to save edited issue
const saveEditIssue = async () => {
    if (!editingIssue) return;
    
    try {
        const data = {
            description: editIssueDescription,
            severity: editIssueSeverity,
            due_date: editIssueDueDate ? editIssueDueDate.toISOString().split('T')[0] : null
        };
        
        await axios.put(`/manager/issues/${editingIssue.id}`, data);
        
        // Refresh issues list
        const issuesResponse = await axios.get(`/manager/forms/${form.id}/issues`);
        setIssues(issuesResponse.data.data || []);
        
        // Reset edit state
        cancelEditIssue();
    } catch (error) {
        console.error('Error updating issue:', error);
        setApiError({
            message: 'Failed to update issue',
            details: error.message,
            debug: { error }
        });
    }
};

    // Function to confirm deletion
    const confirmDeleteIssue = (issueId) => {
        setDeleteIssueId(issueId);
        setIsDeleting(true);
    };

    // Function to cancel deletion
    const cancelDeleteIssue = () => {
        setDeleteIssueId(null);
        setIsDeleting(false);
    };

    // Function to delete issue
    const deleteIssue = async () => {
        if (!deleteIssueId) return;
        
        try {
            await axios.delete(`/manager/issues/${deleteIssueId}`);
            
            // Refresh issues list
            const issuesResponse = await axios.get(`/manager/forms/${form.id}/issues`);
            setIssues(issuesResponse.data.data || []);
            
            // Reset delete state
            cancelDeleteIssue();
        } catch (error) {
            console.error('Error deleting issue:', error);
            setApiError({
                message: 'Failed to delete issue',
                details: error.message,
                debug: { error }
            });
        }
    };
    // Validate issue fields when status is Rejected
    const validateIssueFields = () => {
        const errors = {};
        
        if (isRejected) {
            if (!issueDescription.trim()) {
                errors.description = 'Issue description is required';
            }
            
            if (!issueSeverity) {
                errors.severity = 'Severity level is required';
            }
            
            if (!issueDueDate) {
                errors.dueDate = 'Due date is required';
            } else {
                // Ensure due date is in the future
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (issueDueDate < today) {
                    errors.dueDate = 'Due date must be in the future';
                }
            }
        }
        
        setIssueErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Function to handle status change submission
    const handleStatusChange = async () => {
        // Reset any previous errors
        setApiError(null);
        
        // Use form ID from either formData or directly from form prop
        const formId = formData?.id || form?.id;
        
        if (!formId) {
            setApiError({
                message: 'Form ID is missing',
                details: 'Cannot update the form status because the form ID is missing.',
                debug: { formData, form }
            });
            return;
        }
        
        setIsSubmitting(true);
        
        // Declare data here so it's available in both try and catch blocks
        let data = {};
        
        try {
            // Map status text to status_id
            let status_id;
            switch (selectedStatus) {
                case 'Approved':
                    status_id = 5;
                    break;
                case 'Rejected':
                    status_id = 4;
                    break;
                default:
                    status_id = 5; // Default to In Progress
            }
            
            data = { status_id }; // Assign to existing variable
            
            // Add issue details if rejected
            if (selectedStatus === 'Rejected') {
                if (!validateIssueFields()) {
                    setIsSubmitting(false);
                    return;
                }
                
                data.issue_description = issueDescription;
                data.issue_severity = issueSeverity;
                
                if (issueDueDate) {
                    data.issue_due_date = issueDueDate.toISOString().split('T')[0];
                }
            }
            
            console.log(`Submitting form status update to /manager/forms/${formId}/status`);
            console.log('Data:', data);
            
            // CSRF protection is disabled - don't include the token
            const response = await axios.post(`/manager/forms/${formId}/status`, data);
            
            console.log('Response:', response.data);
            
            // Show success message
            alert(`Form status successfully updated to ${selectedStatus}`);
            
            // Refresh the page to show updated data
            window.location.reload();
            
        } catch (error) {
            console.error('Error updating form status:', error);
            
            // Create detailed error object
            let errorMessage = 'Failed to update form status';
            let errorDetails = '';
            let errorData = null;
            
            if (error.response) {
                errorMessage = `Server Error (${error.response.status})`;
                errorDetails = error.response.data?.message || 'The server encountered an internal error.';
                errorData = error.response.data;
                
                // Log the full response for debugging
                console.error('Full error response:', error.response);
            } else if (error.request) {
                errorMessage = 'No response from server';
                errorDetails = 'The server did not respond to the request.';
            } else {
                errorMessage = error.message || 'Unknown error';
                errorDetails = 'An error occurred while preparing the request.';
            }
            
            setApiError({
                message: errorMessage,
                details: errorDetails,
                debug: {
                    url: `/manager/forms/${formId}/status`,
                    data: data, // Now this works!
                    serverResponse: errorData,
                    error: error.message
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this function outside useEffect for reuse
    const fetchFormDetails = async () => {
        if (!form || !form.id) {
            setFormError('No form ID provided');
            setLoading(false);
            return;
        }
        
        try {
            const formResponse = await axios.get(`/manager/forms/${form.id}/details`);

            setFormData(formResponse.data);
            
            // Check for existing AI analysis in the response
            const responseAnalysis = formResponse.data.form?.aiAnalysis || formResponse.data.form?.ai_analysis;
            if (responseAnalysis) {
                let analysisObject;
                if (typeof responseAnalysis === 'string') {
                    // If the data is a string, parse it
                    try {
                        analysisObject = JSON.parse(responseAnalysis);
                    } catch (e) {
                        console.error("Failed to parse AI analysis JSON from API response:", e);
                        setAnalysisError("Could not display saved analysis. Data format error.");
                        setLoading(false);
                        return;
                    }
                } else {
                    // If it's already an object, use it directly
                    analysisObject = responseAnalysis;
                }
                setAiAnalysis(analysisObject);
            } else if (!aiAnalysis) {
                // No existing analysis in response and not already loaded from props, automatically generate one
                generateAIAnalysis();
            }
            
            // Call the dedicated issue fetching function
            await fetchIssues();
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching form details:', error);
            setFormError(error.message || 'Failed to load form details');
            setLoading(false);
        }
    };

    // Function to fetch issues based on the selected version
const fetchIssues = async (version = issueVersion) => {
  setIssuesLoading(true);
  try {
    let issuesResponse;
    
    if (version === 'current') {
      issuesResponse = await axios.get(`/manager/forms/${form.id}/issues`);
      
      // Get counts for all issues in one batch request
      if (issuesResponse.data.data?.length > 0) {
        const issueIds = issuesResponse.data.data.map(issue => issue.id);
        const countsResponse = await axios.get('/manager/issues/corrective-actions-count', {
          params: { issueIds: issueIds.join(',') }
        });
        
        if (countsResponse.data.data) {
          setCorrectiveActionCounts(countsResponse.data.data);
        }
      }
    } else {
      // Previous version handling - same approach
      issuesResponse = await axios.get(`/manager/forms/${form.id}/previous-issues`);
      
      if (issuesResponse.data.data?.length > 0) {
        const issueIds = issuesResponse.data.data.map(issue => issue.id);
        const countsResponse = await axios.get('/manager/issues/corrective-actions-count', {
          params: { issueIds: issueIds.join(',') }
        });
        
        if (countsResponse.data.data) {
          setCorrectiveActionCounts(countsResponse.data.data);
        }
      }
    }
    
    setIssues(issuesResponse.data.data || []);
  } catch (error) {
    console.error('Error fetching issues:', error);
    setApiError({
      message: 'Failed to fetch issues',
      details: error.message,
      debug: { error }
    });
  } finally {
    setIssuesLoading(false);
  }
};

    // Fetch form details when modal opens
    useEffect(() => {
        fetchFormDetails();
    }, [form.id]);

    // Check for existing AI analysis in initial props
    useEffect(() => {
        // Check both possible field names (ai_analysis and aiAnalysis)
        const initialAnalysisData = form?.ai_analysis || form?.aiAnalysis;
        
        if (!initialAnalysisData) {
            // If there's no data at all, we'll let fetchFormDetails handle generation
            return;
        }

        let analysisObject;
        if (typeof initialAnalysisData === 'string') {
            // If the data is a string, parse it
            try {
                analysisObject = JSON.parse(initialAnalysisData);
            } catch (e) {
                console.error("Failed to parse AI analysis JSON from props:", e);
                setAnalysisError("Could not display saved analysis. Data format error.");
                return;
            }
        } else {
            // If it's already an object, use it directly
            analysisObject = initialAnalysisData;
        }

        // Set the state with the guaranteed-to-be-an-object data
        setAiAnalysis(analysisObject);
    }, [form]);

    // Modify useEffect to call the new function
useEffect(() => {
  if (form.id) {
    fetchIssues(issueVersion);
  }
}, [form.id, issueVersion]);

    // Function to get the severity badge class
    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'Low':
                return 'bg-blue-100 text-blue-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'High':
                return 'bg-orange-100 text-orange-800';
            case 'Critical':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Function for status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'revising':
                return 'bg-orange-100 text-orange-800';
            case 'rejected':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    function formatDateTime(isoString) {
        const date = new Date(isoString);

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kuala_Lumpur',
        };

        return date.toLocaleString('en-GB', options);
    }

    function parseAsUTCAndConvert(dateString) {
        // Convert "2025-06-23 16:58:22" to "2025-06-23T16:58:22Z"
        const isoString = dateString.replace(' ', 'T') + 'Z';
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', {
            timeZone: 'Asia/Kuala_Lumpur',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Severity options for dropdown
    const severityOptions = [
        { value: 'Low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
        { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800' },
        { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
    ];

    // Helper function to extract filename from URL
    const extractFileName = (url) => {
        if (!url) return 'File';
        
        try {
            // Try to get the filename from the URL path
            const urlParts = url.split('/');
            let fileName = urlParts[urlParts.length - 1];
            
            // Remove any query parameters
            fileName = fileName.split('?')[0];
            
            // URL decode the filename
            fileName = decodeURIComponent(fileName);
            
            // If filename is too long, truncate it
            if (fileName.length > 40) {
                const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
                return fileName.substring(0, 37) + '...' + (extension ? '.' + extension : '');
            }
            
            return fileName;
        } catch (e) {
            // If parsing fails, return a generic name
            return 'Attached File';
        }
    };

    // Add this function with your other functions
const toggleCorrectiveActions = async (issueId) => {
    // Toggle expansion state
    const newExpandedState = { ...expandedIssues };
    newExpandedState[issueId] = !expandedIssues[issueId];
    setExpandedIssues(newExpandedState);
    
    // If we're expanding and don't have data yet, fetch it
    if (newExpandedState[issueId] && !correctiveActions[issueId]) {
        try {
            setLoadingCorrectiveActions({
                ...loadingCorrectiveActions,
                [issueId]: true
            });
            
            const response = await axios.get(`/manager/issues/${issueId}/corrective-actions`);
            
            setCorrectiveActions({
                ...correctiveActions,
                [issueId]: response.data.data || []
            });
        } catch (error) {
            console.error('Error fetching corrective actions:', error);
            setApiError({
                message: 'Failed to fetch corrective actions',
                details: error.message,
                debug: { error }
            });
        } finally {
            setLoadingCorrectiveActions({
                ...loadingCorrectiveActions,
                [issueId]: false
            });
        }
    }
};

    // Generate AI Analysis function
    const generateAIAnalysis = async () => {
        if (!form || !form.id) {
            setAnalysisError('No form ID provided for analysis');
            return;
        }

        // Prevent generating if already analyzing or analysis exists
        if (isAnalyzing || aiAnalysis) {
            return;
        }

        try {
            setIsAnalyzing(true);
            setAnalysisError(null);

            const response = await axios.post(`/manager/forms/${form.id}/generate-analysis`);
            
            if (response.data.success) {
                setAiAnalysis(response.data.analysis);
            } else {
                setAnalysisError(response.data.error || 'Failed to generate analysis');
            }
        } catch (error) {
            console.error('Error generating AI analysis:', error);
            setAnalysisError(
                error.response?.data?.error || 
                error.message || 
                'Failed to generate AI analysis'
            );
        } finally {
            setIsAnalyzing(false);
    }
};

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center p-6">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>
                    <p className="mt-4 text-sm font-medium text-gray-600">Loading form details...</p>
                </div>
            </div>
        );
    }

    if (formError) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error Loading Form</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{formError}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-h-[90vh] overflow-y-auto p-6">
            {/* Sticky header with consistent styling from AuditReviewModal */}
            <div className="sticky -top-4 -mx-4 z-10 bg-white pb-4 pt-4 md:-mx-6 md:-top-6 md:pt-4">
                <div className="px-4 md:px-6">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <h2 className="text-xl font-semibold text-gray-800">
                            <span className="text-green-600">Form Review:</span> {formData?.form?.formName || 'Unnamed Form'}
                        </h2>
                        <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(formData?.form?.status || '')}`}>
                                <span className="mr-1.5 h-2 w-2 rounded-full bg-current"></span>
                                {formData?.form?.status || 'Pending Review'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 border-b border-gray-200"></div>
            </div>

            {/* Add spacing after sticky header */}
            <div className="mb-6"></div>
            
            {/* Form details section - with styling consistent with AuditReviewModal */}
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-green-50 px-4 py-3">
                    <h3 className="text-sm font-medium text-gray-700">Form Information</h3>
                </div>
                <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-3">
                    <div className="p-4">
                        <p className="text-xs font-medium uppercase text-gray-500">Form ID</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{form.formId || `FORM-${form.id}`}</p>
                    </div>
                    <div className="p-4 ">
                        <p className="text-xs font-medium uppercase text-gray-500">Outlet</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{form.outlet || 'Unknown'}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-xs font-medium uppercase text-gray-500">Updated At</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            {formData?.form?.updatedAt ? parseAsUTCAndConvert(formData.form.updatedAt) : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                <div className="divide-y divide-gray-200">
                    <div className="bg-green-50 px-4 py-3">
                        <h3 className="text-md font-medium text-gray-800">Form Questions & Responses</h3>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="flex items-center text-gray-500">
                                <svg className="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading form details...</span>
                            </div>
                        </div>
                    ) : formError ? (
                        <div className="p-4">
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <pre className="whitespace-pre-wrap font-mono text-xs bg-red-50 p-2 rounded border border-red-100 overflow-auto max-h-40">
                                                {formError}
                                            </pre>
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={fetchFormDetails}
                                                className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : formData && formData.combinedForm ? (
                        formData.combinedForm.map((item) => (
                            <div key={item.id} className="px-4 py-4">
                                <p className="mb-1 text-sm font-medium text-gray-700">{item.label}</p>
                                
                                {/* Render different question types */}
                                {item.type === 'textarea' && (
                                    <p className="whitespace-pre-wrap text-sm text-gray-600">{item.value || 'No response'}</p>
                                )}
                                
                                {item.type === 'text' && (
                                    <p className="text-sm text-gray-600">{item.value || 'No response'}</p>
                                )}
                                
                                {item.type === 'checkbox' && (
                                    <div className="mt-1">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                            item.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.value ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                )}

                                {item.type === 'checkbox-group' && (
                                    <div className="mt-1 text-sm text-gray-600">
                                        {item.value && item.value.length > 0 ? (
                                            <ul className="list-inside list-disc">
                                                {item.value.map((option, index) => (
                                                    <li key={index}>{option}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'No options selected'
                                        )}
                                    </div>
                                )}

                                {item.type === 'file' && (
                                    <div className="mt-1">
                                        {item.value ? (
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <a 
                                                    href={item.value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {extractFileName(item.value)}
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-sm italic text-gray-400">No file uploaded</span>
                                        )}
                                    </div>
                                )}

                                {item.type === 'select' && (
                                    <div className="mt-1">
                                        {item.value ? (
                                            <span className="text-sm text-gray-600">{item.value}</span>
                                        ) : (
                                            <span className="text-sm italic text-gray-400">No option selected</span>
                                        )}
                                    </div>
                                )}

                                {item.type === 'date' && (
                                    <div className="mt-1">
                                        {item.value ? (
                                            <span className="text-sm text-gray-600">{formatDate(item.value)}</span>
                                        ) : (
                                            <span className="text-sm italic text-gray-400">No date selected</span>
                                        )}
                                    </div>
                                )}

                                {item.type === 'radio' && (
                                    <div className="mt-1">
                                        {item.value ? (
                                            <span className="text-sm text-gray-600">{item.value}</span>
                                        ) : (
                                            <span className="text-sm italic text-gray-400">No option selected</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No form data available
                        </div>
                    )}
                </div>
            </div>

            {/* AI-Powered Analysis Section */}
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-blue-50 px-4 py-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <svg className="mr-2 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI-Powered Analysis
                    </h3>
                </div>
                
                <div className="p-4">
                    {isAnalyzing ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center space-x-3">
                                <svg className="h-6 w-6 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm text-gray-600">Generating AI analysis...</span>
                            </div>
                        </div>
                    ) : analysisError ? (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{analysisError}</p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={generateAIAnalysis}
                                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                                        >
                                            Retry Analysis
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="space-y-6">
                            {/* Compliance Score */}
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Compliance Score</h4>
                                    <p className="text-xs text-gray-500">Overall compliance assessment</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${
                                        aiAnalysis.compliance_score >= 80 ? 'text-green-600' :
                                        aiAnalysis.compliance_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {aiAnalysis.compliance_score}%
                                    </div>
                                    <div className={`text-xs font-medium ${
                                        aiAnalysis.risk_level === 'Low' ? 'text-green-600' :
                                        aiAnalysis.risk_level === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {aiAnalysis.risk_level} Risk
                                    </div>
                                </div>
                            </div>

                            {/* Key Findings */}
                            {aiAnalysis.key_findings && aiAnalysis.key_findings.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <svg className="mr-1 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Key Findings
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiAnalysis.key_findings.map((finding, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                                                {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <svg className="mr-1 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Recommendations
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiAnalysis.recommendations.map((recommendation, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                                                {recommendation}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Areas of Concern */}
                            {aiAnalysis.areas_of_concern && aiAnalysis.areas_of_concern.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <svg className="mr-1 h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        Areas of Concern
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiAnalysis.areas_of_concern.map((concern, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                                {concern}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Positive Aspects */}
                            {aiAnalysis.positive_aspects && aiAnalysis.positive_aspects.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <svg className="mr-1 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                        Positive Aspects
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiAnalysis.positive_aspects.map((aspect, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                                                {aspect}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-sm text-gray-500">No AI analysis available</div>
                        </div>
                    )}
                </div>
            </div>

             {/* Issues section - with consistent styling */}
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-green-50 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Issues</h3>
                    
                    {/* Version selector dropdown */}
                    <div className="flex items-center">
                        <label htmlFor="issue-version" className="mr-2 text-xs text-gray-600">
                            Version:
                        </label>
                        <select
                            id="issue-version"
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                            value={issueVersion}
                            onChange={(e) => setIssueVersion(e.target.value)}
                        >
                            <option value="current">Current</option>
                            <option value="previous">Previous Version</option>
                        </select>
                    </div>
                </div>
                
                {issuesLoading ? (
  <div className="p-4 text-center">
    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
    <p className="mt-2 text-sm text-gray-500">Loading issues...</p>
  </div>
) : issues.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                        {issueVersion === 'previous' 
                            ? 'No issues found in the previous version.' 
                            : 'No issues have been reported for this form.'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {issues.map((issue) => (
                            <div key={issue.id} className="p-4">
                                {editingIssue && editingIssue.id === issue.id ? (
                                    /* Edit Issue Form */
                                    <div className="rounded-md bg-blue-50 p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-medium text-blue-800">Edit Issue #{issue.id}</h4>
                                            <button
                                                onClick={() => cancelEditIssue()}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Issue Description <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    value={editIssueDescription}
                                                    onChange={(e) => setEditIssueDescription(e.target.value)}
                                                ></textarea>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Severity <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    value={editIssueSeverity}
                                                    onChange={(e) => setEditIssueSeverity(e.target.value)}
                                                >
                                                    {severityOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Resolution Due Date <span className="text-red-500">*</span>
                                                </label>
                                                <DatePicker
                                                    selected={editIssueDueDate}
                                                    onChange={date => setEditIssueDueDate(date)}
                                                    minDate={new Date()}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                />
                                            </div>
                                            
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                                    onClick={() => cancelEditIssue()}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                                                    onClick={() => saveEditIssue()}
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Regular Issue View */
                                    <>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                            {/* Top Left: ID, Severity, Due Date */}
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                                <span className="font-semibold">Issue #{issue.id}</span>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityBadgeClass(issue.severity)}`}>
                                                    {issue.severity}
                                                </span>
                                                <span className="text-gray-500">Due: {formatDate(issue.due_date)}</span>
                                            </div>

                                            {/* Top Right: Actions and Created Date */}
                                            <div className="flex items-center gap-3 self-start sm:self-center">
                                                <div className="flex space-x-2">
                                                    {/* Only show edit/delete buttons for current version issues that don't have corrective actions */}
                                                    {issueVersion === 'current' && (!correctiveActions[issue.id] || correctiveActions[issue.id]?.length === 0) && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditIssue(issue)}
                                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                                title="Edit Issue"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDeleteIssue(issue.id)}
                                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Delete Issue"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDateTime(issue.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-700">{issue.description}</p>
                                        </div>
                                        
                                        {/* Corrective Actions Section */}
                                        <div className="mt-3 border-t border-gray-100 pt-3">
                                            <button 
                                                onClick={() => toggleCorrectiveActions(issue.id)}
                                                className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900"
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className={`h-4 w-4 mr-1 transition-transform ${expandedIssues[issue.id] ? 'rotate-90' : ''}`} 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                Corrective Actions
                                                
                                                {/* Always show the count badge, regardless of value */}
                                                <span className={`ml-2 rounded-full px-2 py-0.5 ${
                                                    correctiveActionCounts[issue.id] > 0
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {correctiveActionCounts[issue.id] || 0}
                                                </span>
                                            </button>
                                            
                                            {expandedIssues[issue.id] && (
                                                <div className="mt-2 pl-4">
                                                    {loadingCorrectiveActions[issue.id] ? (
                                                        <div className="flex items-center justify-center py-3">
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-green-600"></div>
                                                            <span className="ml-2 text-xs text-gray-500">Loading corrective actions...</span>
                                                        </div>
                                                    ) : correctiveActions[issue.id]?.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {correctiveActions[issue.id].map(action => (
                                                                <div 
                                                                    key={action.id} 
                                                                    className="rounded-md border-l-4 border-green-300 bg-gray-50 p-3"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="text-xs text-gray-500">
                                                                            {formatDateTime(action.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <p className="mt-2 text-sm text-gray-700">{action.description}</p>
                                                                    
                                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                        {action.completion_date && (
                                                                            <div>
                                                                                <span className="font-medium">Completed:</span> {formatDate(action.completion_date)}
                                                                            </div>
                                                                        )}
                                                                        {action.verification_date && (
                                                                            <div>
                                                                                <span className="font-medium">Verified:</span> {formatDate(action.verification_date)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-2 text-center text-xs text-gray-500">
                                                            No corrective actions found for this issue.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Delete Confirmation Modal */}
                {isDeleting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-medium text-gray-900">Delete Issue</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Are you sure you want to delete this issue? This action cannot be undone.
                            </p>
                            <div className="mt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    onClick={() => cancelDeleteIssue()}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                                    onClick={() => deleteIssue()}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Status change section - UpdateStatusPanel */}
            <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
                <h3 className="text-base font-medium text-gray-900">Update Status</h3>
                
                <div className="mt-4">
                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                        Status
                    </label>
                    <select
                        id="status-select"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                
                {/* Issue fields - only show when Rejected is selected */}
                {isRejected && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                        <h4 className="mb-4 text-sm font-medium text-red-800">Issue Details</h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="issue-description" className="block text-sm font-medium text-gray-700">
                                    Issue Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="issue-description"
                                    rows="3"
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${issueErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    placeholder="Describe the compliance issue that needs to be addressed..."
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                ></textarea>
                                {issueErrors.description && (
                                    <p className="mt-1 text-sm text-red-600">{issueErrors.description}</p>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="issue-severity" className="block text-sm font-medium text-gray-700">
                                    Severity <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="issue-severity"
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${issueErrors.severity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    value={issueSeverity}
                                    onChange={(e) => setIssueSeverity(e.target.value)}
                                >
                                    <option value="">Select severity level</option>
                                    {severityOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {issueErrors.severity && (
                                    <p className="mt-1 text-sm text-red-600">{issueErrors.severity}</p>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="issue-due-date" className="block text-sm font-medium text-gray-700">
                                    Resolution Due Date <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    id="issue-due-date"
                                    selected={issueDueDate}
                                    onChange={date => setIssueDueDate(date)}
                                    minDate={new Date()} // Can't select dates in the past
                                    dateFormat="yyyy-MM-dd"
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${issueErrors.dueDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    placeholderText="Select due date"
                                />
                                {issueErrors.dueDate && (
                                    <p className="mt-1 text-sm text-red-600">{issueErrors.dueDate}</p>
                                )}
                            </div>
                            
                            <div className="rounded-md bg-yellow-50 p-3">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            An issue will be created for tracking. The outlet must resolve this by the due date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            selectedStatus === 'Approved'
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : selectedStatus === 'Rejected'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        onClick={handleStatusChange}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="mr-2 -ml-1 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            `Update`
                        )}
                    </button>
                </div>
                
                {/* API Error Display - Added below submit button */}
                {apiError && (
                    <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{apiError.message}</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{apiError.details}</p>
                                </div>
                                
                                <div className="mt-4">
                                    <details className="text-sm">
                                        <summary className="cursor-pointer font-medium text-red-800 hover:underline">
                                            Technical Details
                                        </summary>
                                        <div className="mt-2 rounded bg-red-100 p-2 text-xs font-mono">
                                            <pre className="whitespace-pre-wrap">
                                                {JSON.stringify(apiError.debug, null, 2)}
                                            </pre>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
