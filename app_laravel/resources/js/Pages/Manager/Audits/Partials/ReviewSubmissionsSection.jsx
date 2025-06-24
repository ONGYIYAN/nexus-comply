import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function ReviewSubmissionsSection({ onReviewForm, onReviewAudit, statusFilter = 'all', dateFilter = 'all' }) {
    // State to track which audit groups are expanded
    const [expandedAudits, setExpandedAudits] = useState({});
    
    // State for real data
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    
    // Add filter/search/pagination state
    const [pendingStatusFilter, setPendingStatusFilter] = useState('all');
    const [pendingDateFilter, setPendingDateFilter] = useState('all');
    const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
    const [appliedDateFilter, setAppliedDateFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Toggle expansion of an audit group
    const toggleAudit = (auditId) => {
        // Get the audit object
        const audit = audits.find(a => a.id === auditId);
        
        // Check if the audit has forms (if formCount is available from API)
        const formCount = audit?.formCount || 0;
        
        // Don't allow expansion for audits with no forms
        if (formCount === 0) {
            // Optionally show a toast or message here
            console.log('This audit has no forms to display');
            return;
        }
        
        // Toggle expansion state
        setExpandedAudits(prev => ({
            ...prev,
            [auditId]: !prev[auditId]
        }));
        
        // If we're expanding and don't have forms yet, fetch them
        if (!expandedAudits[auditId] && !audit?.forms) {
            fetchAuditForms(auditId);
        }
    };
    
    // Fetch all audits the manager is responsible for
    useEffect(() => {
        fetchAudits();
    }, []);
    
    const fetchAudits = async () => {
        try {
            setLoading(true);
            console.log('Starting API request to:', '/api/manager/audits');
            
            // Update the URL to match the working endpoint
            const response = await axios.get('/manager/audits-data');
            // NOT '/api/manager/audits' since your working endpoint doesn't have the /api prefix
            
            console.log('Received data:', response.data);
            
            // Initialize audits without forms yet
            const fetchedAudits = response.data.audits.map(audit => ({
                ...audit,
                forms: null // We'll fetch forms when the audit is expanded
            }));
            
            setAudits(fetchedAudits);
            setError(null);
            setErrorDetails(null);
        } catch (err) {
            console.error('Error fetching audits:', err);
            setError('Failed to load audits. Please try again later.');
            setErrorDetails(detailedError);
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch forms for a specific audit
    const fetchAuditForms = async (auditId) => {
        try {
            // Update the specific audit to show loading state for forms
            setAudits(prev => prev.map(audit => 
                audit.id === auditId 
                    ? { ...audit, formsLoading: true }
                    : audit
            ));
            
            const response = await axios.get(`/manager/audits/${auditId}/forms`);
            
            // Update the specific audit with its forms
            setAudits(prev => prev.map(audit => 
                audit.id === auditId 
                    ? { 
                        ...audit, 
                        forms: response.data.forms,
                        formsLoading: false,
                        formsError: null
                    }
                    : audit
            ));
        } catch (err) {
            console.error(`Error fetching forms for audit ${auditId}:`, err);
            
            // Update the specific audit to show error state for forms
            setAudits(prev => prev.map(audit => 
                audit.id === auditId 
                    ? { 
                        ...audit, 
                        formsLoading: false,
                        formsError: 'Failed to load forms for this audit.'
                    }
                    : audit
            ));
        }
    };

    // Function to determine badge color based on status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-orange-800';
            case 'revising':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Add this function after fetchAudits() but before the render methods
    const calculatePendingSubmissions = () => {
        // Track unique outlet names with pending submissions
        const outletsWithPendingSubmissions = new Set();
        
        // Iterate through audits
        audits.forEach(audit => {
            // Consider an outlet as having pending submissions if:
            // 1. The audit status is 'pending' or 'in progress'
            // 2. The audit progress is less than 100%
            const isPending = (
                audit.status?.toLowerCase() === 'pending'
            );
            
            if (isPending && audit.outletName) {
                outletsWithPendingSubmissions.add(audit.outletName);
            }
        });
        
        // Return the count of unique outlets
        return outletsWithPendingSubmissions.size;
    };

    // Add this function after calculatePendingSubmissions()
    const calculateOverdueAudits = () => {
        // Get current date (without time portion for accurate comparison)
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        // Count overdue audits
        let overdueCount = 0;
        
        // Iterate through audits
        audits.forEach(audit => {
            // Check if audit has a due date
            if (audit.dueDate) {
                const dueDate = new Date(audit.dueDate);
                dueDate.setHours(0, 0, 0, 0); // Reset time portion for accurate comparison
                
                // Consider an audit as overdue if:
                // 1. Current date is after the due date
                // 2. The audit status is 'pending'
                const isOverdue = (
                    currentDate > dueDate && 
                    audit.status?.toLowerCase() === 'pending'
                );
                
                if (isOverdue) {
                    overdueCount++;
                }
            }
        });
        
        return overdueCount;
    };

    const calculateFormsRequiringReview = () => {
    let pendingReviewCount = 0;
    
    // Iterate through audits and their forms
    audits.forEach(audit => {
        // Skip if no forms or not an array
        if (!audit.forms || !Array.isArray(audit.forms)) return;
        
        // Count forms with status "pending review" or similar
        pendingReviewCount += audit.forms.filter(form => 
            form.status?.toLowerCase() === 'pending'
        ).length;
    });
    
    return pendingReviewCount;
    };

    // Add this helper function to sort audits by update date (most recent first)
    const sortAuditsByUpdateDate = (auditsToSort) => {
        return [...auditsToSort].sort((a, b) => {
            // Try to get the most relevant date field for sorting
            const dateA = new Date(a.updatedAt || a.updated_at || a.startDate || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.updated_at || b.startDate || b.createdAt || 0);
            
            // Sort in descending order (newest first)
            return dateB - dateA;
        });
    };

    // Filtering logic
    const filteredAudits = useMemo(() => {
        const query = search.toLowerCase();
        const now = new Date();
        return (audits || []).filter(audit => {
            // Search filter
            const matchesSearch =
                (audit.title || '').toLowerCase().includes(query) ||
                (audit.outletName || '').toLowerCase().includes(query) ||
                (audit.status || '').toLowerCase().includes(query);

            // Status filter
            const matchesStatus =
                appliedStatusFilter === 'all' ||
                (audit.status || '').toLowerCase() === appliedStatusFilter;

            // Date filter
            let matchesDate = true;
            if (appliedDateFilter !== 'all') {
                const auditDate = new Date(audit.updatedAt || audit.updated_at || audit.startDate || audit.createdAt);
                if (isNaN(auditDate)) return false;
                switch (appliedDateFilter) {
                    case 'last7':
                        matchesDate = (now - auditDate) / (1000 * 60 * 60 * 24) <= 7;
                        break;
                    case 'last30':
                        matchesDate = (now - auditDate) / (1000 * 60 * 60 * 24) <= 30;
                        break;
                    case 'last90':
                        matchesDate = (now - auditDate) / (1000 * 60 * 60 * 24) <= 90;
                        break;
                    case 'thisYear':
                        matchesDate = auditDate.getFullYear() === now.getFullYear();
                        break;
                    default:
                        matchesDate = true;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [audits, search, appliedStatusFilter, appliedDateFilter]);

    const total = filteredAudits.length;
    const totalPages = Math.ceil(total / perPage);
    const paginatedAudits = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredAudits.slice(start, start + perPage);
    }, [filteredAudits, currentPage, perPage]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setAppliedStatusFilter(pendingStatusFilter);
        setAppliedDateFilter(pendingDateFilter);
    };
    const handlePerPageChange = (e) => {
        setPerPage(Number(e.target.value));
        setCurrentPage(1);
    };
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Use filtered audits for rendering
    const auditsToRender = paginatedAudits;

    // Render loading state for the entire section
    if (loading) {
        return (
            <div className="px-6 py-6">
                <h3 className="mb-6 text-lg font-semibold text-gray-800">Review Form Submissions</h3>
                <div className="flex justify-center py-12">
                    <div className="flex items-center text-gray-500">
                        <svg className="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading audits...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="px-6 py-6">
                <h3 className="mb-6 text-lg font-semibold text-gray-800">Review Form Submissions</h3>
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
                                <p>{error}</p>
                                {errorDetails && (
                                    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs font-mono text-red-800">
                                        {errorDetails}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchAudits}
                                    className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render no audits message
    if (auditsToRender.length === 0) {
        return (
            <div className="px-6 py-6">
                <h3 className="mb-6 text-lg font-semibold text-gray-800">Review Form Submissions</h3>
                <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">No Audits Found</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>There are currently no audits requiring your review.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Regional Audit Status</h3>
            
            {/* Keep the summary cards with dummy data as requested */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
                    <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <dt className="truncate text-sm font-medium text-gray-500">Outlets with Pending Submissions</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {calculatePendingSubmissions()}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
                    <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <dt className="truncate text-sm font-medium text-gray-500">Overdue Audits in Region</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{calculateOverdueAudits()}</dd>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
                    <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <dt className="truncate text-sm font-medium text-gray-500">Forms Requiring Review</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{calculateFormsRequiringReview()}</dd>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-6 py-6">
                <h3 className="mb-6 text-lg font-semibold text-gray-800">Review Form Submissions</h3>
                
                {/* Filters Row (Date + Status + Apply Button) */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label htmlFor="dateFilter" className="mr-2 text-sm font-medium text-gray-700">Date Range:</label>
                            <select
                                id="dateFilter"
                                value={pendingDateFilter}
                                onChange={e => setPendingDateFilter(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="all">All Dates</option>
                                <option value="last7">Last 7 Days</option>
                                <option value="last30">Last 30 Days</option>
                                <option value="last90">Last 90 Days</option>
                                <option value="thisYear">This Year</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700">Status:</label>
                            <select
                                id="statusFilter"
                                value={pendingStatusFilter}
                                onChange={e => setPendingStatusFilter(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="revising">Revising</option>
                            </select>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
                <div className="mb-4 border-b border-gray-200"></div>

                {/* Show entries and search row */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <span>Show</span>
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                        <span>entries</span>
                    </div>
                    <input
                        type="text"
                        className="ml-auto rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ minWidth: 180 }}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-green-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                    Audit Name & Outlet
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                    Progress
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                     Start Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                    Forms
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                    Audit Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortAuditsByUpdateDate(auditsToRender).map((audit) => (
                                <React.Fragment key={audit.id}>
                                    {/* Audit row */}
                                    <tr 
                                        className={`cursor-pointer transition-colors hover:bg-green-50 ${expandedAudits[audit.id] ? 'bg-green-50' : ''}`}
                                        onClick={() => toggleAudit(audit.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full border ${expandedAudits[audit.id] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white text-gray-500'}`}>
                                                    {expandedAudits[audit.id] ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{audit.auditType || 'Unnamed Audit'}</div>
                                                    <div className="text-xs text-gray-500">{audit.outletName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="mr-4 h-2 w-full rounded-full bg-gray-200">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            audit.progress === 100 ? 'bg-green-500' : 
                                                            audit.progress > 60 ? 'bg-green-400' : 'bg-green-300'
                                                        }`}
                                                        style={{ width: `${audit.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-medium">{audit.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            {formatDate(audit.startDate)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(audit.status)}`}>
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {/* Existing Forms button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAudit(audit.id);
                                                    }}
                                                    disabled={!audit.formCount || audit.formCount === 0}
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium 
                                                        ${!audit.formCount || audit.formCount === 0 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' 
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                                                    title={!audit.formCount || audit.formCount === 0 
                                                        ? 'No forms available for this audit' 
                                                        : `${audit.formCount} form${audit.formCount !== 1 ? 's' : ''} available`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                    </svg>
                                                    Forms {audit.formCount > 0 && `(${audit.formCount})`}
                                                </button>
                                                </div></td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                {/* New View Audit button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onReviewAudit({
                                                            id: audit.id,
                                                            name: audit.auditType,
                                                            outlet: audit.outletName,
                                                            progress: audit.progress,
                                                            status: audit.status,
                                                            startDate: audit.startDate,
                                                            dueDate: audit.dueDate,
                                                            formCount: audit.formCount || 0
                                                        });
                                                    }}
                                                    className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                                                    title="View complete audit details"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View Audit
                                                </button>
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded forms section */}
                                    {expandedAudits[audit.id] && (
                                        <tr className="bg-white">
                                            <td colSpan="6" className="px-0 py-0">
                                                <div className="border-t border-gray-100 bg-gray-50 py-2">
                                                    {audit.formsLoading && (
                                                        <div className="flex justify-center py-8">
                                                            <div className="flex items-center text-gray-500">
                                                                <svg className="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <span>Loading forms...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {audit.formsError && (
                                                        <div className="mx-6 my-4 rounded-md bg-red-50 p-4">
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <h3 className="text-sm font-medium text-red-800">Error Loading Forms</h3>
                                                                    <div className="mt-2 text-sm text-red-700">
                                                                        <p>{audit.formsError}</p>
                                                                    </div>
                                                                    <div className="mt-4">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                fetchAuditForms(audit.id);
                                                                            }}
                                                                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                                                                        >
                                                                            Try Again
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {audit.forms && audit.forms.length === 0 && (
                                                        <div className="mx-6 my-4 rounded-md bg-blue-50 p-4">
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <h3 className="text-sm font-medium text-blue-800">No Forms Found</h3>
                                                                    <div className="mt-2 text-sm text-blue-700">
                                                                        <p>There are no forms associated with this audit.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {audit.forms && audit.forms.length > 0 && (
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-100">
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                                                        Form Name
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                                                        Template
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                                                        Date
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                                                        Status
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                                                                        Action
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                                {audit.forms.map((form) => (
                                                                    <tr 
                                                                        key={form.id} 
                                                                        className="hover:bg-gray-50"
                                                                    >
                                                                        <td className="px-6 py-3 text-sm font-medium text-gray-700">
                                                                            {form.formName}
                                                                        </td>
                                                                        <td className="px-6 py-3 text-sm text-gray-500">
                                                                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                                                {form.templateName}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-3 text-sm text-gray-500">
                                                                            {formatDate(form.updatedAt || form.createdAt)}
                                                                        </td>
                                                                        <td className="px-6 py-3">
                                                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(form.status)}`}>
                                                                                {form.status || 'Draft'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-3">
                                                                            {form.status_id !== 1 && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onReviewForm({
                                                                                            id: form.id,
                                                                                            name: form.formName,
                                                                                            type: 'form',
                                                                                            outlet: audit.outletName,
                                                                                            status: form.status,
                                                                                            auditId: audit.id,
                                                                                            auditName: audit.auditType
                                                                                        });
                                                                                    }}
                                                                                    className="rounded bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-100 hover:text-green-800"
                                                                                >
                                                                                    View Details
                                                                                </button>
                                                                            )}
                                                                            
                                                                            {form.status_id === 1 && (
                                                                                <span className="text-xs text-gray-500">Not submitted</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{total === 0 ? 0 : (currentPage - 1) * perPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * perPage, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </p>
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-center space-x-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={`rounded px-3 py-1 text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`rounded px-3 py-1 text-sm ${
                                    page === currentPage ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={`rounded px-3 py-1 text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
