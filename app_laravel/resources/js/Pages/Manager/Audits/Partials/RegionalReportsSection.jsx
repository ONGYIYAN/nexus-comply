import React, { useState, useEffect } from 'react';
import AdminPrimaryButton from '@/Components/AdminPrimaryButton';
import { generateAuditReportPDF } from './AuditReportPDF';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export default function AuditReportingSection({ states = [], complianceCategories = [], outlets = [], managers = [] }) {
    const [generating, setGenerating] = useState(null);
    const [downloadReady, setDownloadReady] = useState(null);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const [reportFileStates, setReportFileStates] = useState({}); // { [reportId]: { loading, exists, url } }

    // Debug logs for props
    useEffect(() => {
        console.log('States from props:', states);
        console.log('Compliance categories from props:', complianceCategories);
        console.log('Outlets from props:', outlets);
        console.log('Managers from props:', managers);
    }, [states, complianceCategories, outlets, managers]);

    // Dummy data for report types
    const reportTypes = [
        {
            id: 1,
            name: 'Overall Compliance Trends Report',
            description: 'Comprehensive overview of compliance trends across all outlets and standards.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            id: 3,
            name: 'Outlet Non-Compliance Summary',
            description: 'Detailed summary of non-compliance issues across outlets.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
        {
            id: 4,
            name: 'Specific Standard Adherence Report',
            description: 'Focused analysis on adherence to specific standards such as HALAL, ISO 22000, etc.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
    ];

    const handleGenerateReport = async (reportId) => {
        setGenerating(reportId);
        setDownloadReady(null);
        setUploading(false);
        setUploadError(null);
        setUploadedUrl(null);

        try {
            // Calculate the date range based on selected month and year
            const dateRange = getMonthDateRange(selectedYear, selectedMonth);
            const startDate = dateRange.start;
            const endDate = dateRange.end;

            // Debug: log the date range being sent
            console.log('Requesting report with:', { startDate, endDate });

            // Get the selected filter value
            const filterSelect = document.getElementById(`filter-${reportId}`);
            const selectedFilter = filterSelect.value;

            // Build query parameters for GET request
            const params = new URLSearchParams({
                reportType: reportTypes.find(r => r.id === reportId).name,
                startDate: startDate,
                endDate: endDate,
                filter: selectedFilter
            }).toString();

            // Get report data from API using GET
            const response = await axios.get(route('manager.audits.generate-report') + '?' + params, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            const data = response.data;

            // Debug: log the data received from backend
            console.log('Report data received:', data);

            // Check if there's no data available
            if (data.noData) {
                setGenerating(null);
                alert(data.message || 'No data available for the selected criteria. Please try different filters or date ranges.');
                return;
            }

            // Generate PDF with month and year in the options
            const pdf = await generateAuditReportPDF(data, {
                reportType: reportTypes.find(r => r.id === reportId).name,
                dateRange: { 
                    start: startDate, 
                    end: endDate,
                    monthName: getMonthName(selectedMonth),
                    year: selectedYear
                },
                filter: selectedFilter
            });

            // Get the report name and filename
            const reportName = reportTypes.find(r => r.id === reportId).name;
            const monthName = getMonthName(selectedMonth);
            const filename = getReportFilename(reportName, monthName, selectedYear);

            // === Upload to Supabase Storage (manager-reports bucket) ===
            setUploading(true);
            // Get PDF as Blob
            const pdfBlob = pdf.output('blob');
            // Define storage path (e.g., 'reports/filename.pdf')
            const storagePath = `reports/${filename}`;
            // Upload to Supabase (manager-reports bucket)
            const { data: uploadData, error: uploadErrorObj } = await supabase.storage.from('manager-reports').upload(storagePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true // allow overwrite
            });
            if (uploadErrorObj) {
                setUploadError(uploadErrorObj.message);
                setUploading(false);
            } else {
                // Get signed URL (valid for 1 hour)
                const { data: signedUrlData, error: signedUrlError } = await supabase
                    .storage
                    .from('manager-reports')
                    .createSignedUrl(storagePath, 60 * 60);
                
                if (signedUrlData?.signedUrl) {
                    setUploadedUrl(signedUrlData.signedUrl);
                    // Open the signed URL in a new tab
                    window.open(signedUrlData.signedUrl, '_blank');
                }
                setUploading(false);
            }

            setGenerating(null);
            setDownloadReady(reportId);
            setTimeout(() => setDownloadReady(null), 3000);
        } catch (error) {
            console.error('Error generating report:', error);
            setGenerating(null);
            setUploading(false);
            setUploadError(error.message || 'Failed to generate or upload report. Please try again.');
            alert(error.message || 'Failed to generate report. Please try again.');
        }
    };

    const handleDateRangeChange = (reportId, value) => {
        const customDateDiv = document.getElementById(`customDateRange-${reportId}`);
        if (value === 'custom') {
            customDateDiv.style.display = 'block';
        } else {
            customDateDiv.style.display = 'none';
        }
    };

    const getMonthDateRange = (year, month) => {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Format as YYYY-MM-DD in local time
      const pad = n => n.toString().padStart(2, '0');
      const format = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      return {
        start: format(startDate),
        end: format(endDate)
      };
    };

    // "Compliance_Report_June_2025.pdf"
    const getMonthName = (monthIndex) => {
      return ['January', 'February', 'March', 'April', 'May', 'June', 
          'July', 'August', 'September', 'October', 'November', 'December'][monthIndex];
    };

    function getReportFilename(reportName, monthName, year) {
        return `${reportName}_${monthName}_${year}.pdf`;
    }

    const checkReportFile = async (reportId, reportName, monthName, year) => {
        setReportFileStates(prev => ({
            ...prev,
            [reportId]: { loading: true, exists: false, url: null }
        }));

        const filename = getReportFilename(reportName, monthName, year);
        const storagePath = `reports/${filename}`;
        // List files in the 'reports' folder and search for the filename
        const { data, error } = await supabase
            .storage
            .from('manager-reports')
            .list('reports', { search: filename });

        if (error) {
            setReportFileStates(prev => ({
                ...prev,
                [reportId]: { loading: false, exists: false, url: null }
            }));
            return;
        }

        const found = data && data.some(file => file.name === filename);
        let url = null;
        if (found) {
            // Get signed URL (valid for 1 hour)
            const { data: signedUrlData, error: signedUrlError } = await supabase
                .storage
                .from('manager-reports')
                .createSignedUrl(storagePath, 60 * 60);
            url = signedUrlData?.signedUrl || null;
        }

        setReportFileStates(prev => ({
            ...prev,
            [reportId]: { loading: false, exists: found, url }
        }));
    };

    useEffect(() => {
        reportTypes.forEach(report => {
            const reportName = report.name;
            const monthName = getMonthName(selectedMonth);
            checkReportFile(report.id, reportName, monthName, selectedYear);
        });
        // eslint-disable-next-line
    }, [selectedMonth, selectedYear, /* add filter if needed */]);

    // Get available months based on selected year
    const getAvailableMonths = (year) => {
        if (year < currentYear) {
            // Past years: show all months
            return Array.from({ length: 12 }, (_, i) => ({
                value: i,
                name: getMonthName(i)
            }));
        } else if (year === currentYear) {
            // Current year: show only months up to current month
            return Array.from({ length: currentMonth + 1 }, (_, i) => ({
                value: i,
                name: getMonthName(i)
            }));
        } else {
            // Future years: show no months
            return [];
        }
    };

    // Update selected month when year changes
    useEffect(() => {
        const availableMonths = getAvailableMonths(selectedYear);
        if (availableMonths.length > 0) {
            // If current selected month is not available, set to last available month
            if (selectedMonth > currentMonth && selectedYear === currentYear) {
                setSelectedMonth(currentMonth);
            }
        }
    }, [selectedYear]);

    return (
        <div className="px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Audit Reporting</h3>

            <p className="mb-6 text-sm text-gray-600">
                Generate various reports to analyze compliance trends, manager performance, and identify areas requiring attention.
            </p>

            <div className="grid gap-6 grid-cols-1">
                {reportTypes.map((report) => (
                    <div key={report.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                        <div className="px-6 py-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {report.icon}
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                                    <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label htmlFor={`month-${report.id}`} className="block text-sm font-medium text-gray-700">Month</label>
                                            <select
                                                id={`month-${report.id}`}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            >
                                                {getAvailableMonths(selectedYear).map(({ value, name }) => (
                                                    <option key={value} value={value}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label htmlFor={`year-${report.id}`} className="block text-sm font-medium text-gray-700">Year</label>
                                            <select
                                                id={`year-${report.id}`}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 3 }, (_, i) => {
                                                    const year = currentYear - i;
                                                    return <option key={year} value={year}>{year}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        {(() => {
                                            // Conditionally render the filter dropdowns
                                            // Only show the dropdown if there is more than one option.
                                            // Otherwise, render a hidden select with the single option pre-selected.

                                            if (report.id === 1) { // State Filter
                                                if (states.length <= 1) {
                                                    return (
                                                        <select id={`filter-${report.id}`} className="hidden" defaultValue={states[0] || ''}>
                                                            {states.length === 1 && <option value={states[0]}>{states[0]}</option>}
                                                        </select>
                                                    );
                                                }
                                            } else if (report.id === 3) { // Outlet Filter
                                                if (outlets.length <= 1) {
                                                    return (
                                                        <select id={`filter-${report.id}`} className="hidden" defaultValue={outlets[0]?.name || ''}>
                                                            {outlets.length === 1 && <option value={outlets[0].name}>{outlets[0].name}</option>}
                                                        </select>
                                                    );
                                                }
                                            } else if (report.id === 4) { // Standard Filter
                                                if (complianceCategories.length <= 1) {
                                                    return (
                                                        <select id={`filter-${report.id}`} className="hidden" defaultValue={complianceCategories[0]?.name || ''}>
                                                            {complianceCategories.length === 1 && <option value={complianceCategories[0].name}>{complianceCategories[0].name}</option>}
                                                        </select>
                                                    );
                                                }
                                            }

                                            // Default: Render the visible dropdown
                                            return (
                                                <>
                                                    <label htmlFor={`filter-${report.id}`} className="block text-sm font-medium text-gray-700">
                                                        {report.id === 3 ? 'Outlet' : (report.id === 4 ? 'Standard' : 'State')}
                                                    </label>
                                                    <select
                                                        id={`filter-${report.id}`}
                                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                                                        defaultValue="all"
                                                    >
                                                        <option value="all">All</option>
                                                        {report.id === 3 && outlets.map(outlet => (
                                                            <option key={outlet.id} value={outlet.name}>{outlet.name}</option>
                                                        ))}
                                                        {report.id === 4 && complianceCategories.map(category => (
                                                            <option key={category.id} value={category.name}>{category.name}</option>
                                                        ))}
                                                        {report.id === 1 && states.map(state => (
                                                            <option key={state} value={state}>{state}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <label className="mr-2 block text-sm font-medium text-gray-700">Format:</label>
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-700">PDF</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest transition duration-150 ease-in-out ${reportFileStates[report.id]?.exists ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            disabled={!reportFileStates[report.id]?.exists}
                                            onClick={() => {
                                                if (reportFileStates[report.id]?.url) {
                                                    window.open(reportFileStates[report.id].url, '_blank');
                                                }
                                            }}
                                            type="button"
                                        >
                                            {reportFileStates[report.id]?.loading ? 'Checking...' : 'View Report'}
                                        </button>
                                        {generating === report.id ? (
                                            <button className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700" disabled>
                                                <svg className="mr-2 h-4 w-4 animate-spin text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </button>
                                        ) : downloadReady === report.id ? (
                                            <div className="flex items-center rounded-md bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-green-700">
                                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Report Generated
                                            </div>
                                        ) : (
                                            <AdminPrimaryButton
                                                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                                                onClick={() => handleGenerateReport(report.id)}
                                            >
                                                Generate Report
                                            </AdminPrimaryButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
