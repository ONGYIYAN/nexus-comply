import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import AdminPrimaryButton from '@/Components/AdminPrimaryButton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';

export default function DashboardPage({
    outletsMonitored = 0,
    pendingSubmissions = 0,
    overdueAudits = 0,
    outletStaffActivity = [],
    nonComplianceHotspots = [],
    error = null,
    pendingReviews = 0,
    complianceData = {},
    userName = '',
    categoryComplianceBarData = [],
}) {
    // Destructure complianceData like admin dashboard
    const {
        fullyCompliant = { count: 0, percentage: 0 },
        partiallyCompliant = { count: 0, percentage: 0 },
        nonCompliant = { count: 0, percentage: 0 }
    } = complianceData;

    const renderCategoryTick = (props) => {
        const { x, y, payload } = props;
        const label = payload.value;
        return (
            <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                style={{
                    fontSize: 14,
                    fontFamily: 'inherit',
                    fill: '#374151', // Tailwind gray-700
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                }}
            >
                {label.length > 28 ? label.slice(0, 27) + '…' : label}
            </text>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manager Dashboard" />

            <div className="py-0">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-0 px-0">
                    {/* Welcome Section */}
                    <div className="mb-6 overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}!</h1>
                        <p className="mt-1 text-gray-600">Here's the current status of outlets in your region.</p>
                        {error && <div className="mt-2 text-red-600">{error}</div>}
                    </div>

                    {/* Key Metric Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Outlets Monitored Card */}
                        <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                            <div className="flex items-center">
                                <div className="mr-4 rounded-full bg-green-100 p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Outlets Monitored</p>
                                    <p className="text-2xl font-bold text-green-600">{outletsMonitored}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Submissions Card */}
                        <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                            <div className="flex items-center">
                                <div className="mr-4 rounded-full bg-green-100 p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Submissions</p>
                                    <p className="text-2xl font-bold text-green-600">{pendingSubmissions}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Reviews Card */}
                        <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                            <div className="flex items-center">
                                <div className="mr-4 rounded-full bg-green-100 p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                                    <p className="text-2xl font-bold text-green-600">{pendingReviews}</p>
                                </div>
                            </div>
                        </div>

                        {/* Overdue Audits Card */}
                        <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                            <div className="flex items-center">
                                <div className="mr-4 rounded-full bg-green-100 p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Overdue Audits</p>
                                    <p className="text-2xl font-bold text-green-600">{overdueAudits}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area - Two Columns on larger screens */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column - Takes 2/3 of the space on large screens */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Auditor Performance */}
                            <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                                <h2 className="mb-4 text-lg font-semibold text-gray-800">Outlet Performance</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Outlet
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Audits Completed
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Pending Submissions
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Overdue Audits
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Rejected Audits
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {outletStaffActivity.map((staff) => (
                                                <tr key={staff.id}>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">{staff.outlet}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm text-gray-900">{staff.auditsCompleted}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm text-gray-900">{staff.pendingSubmissions}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm text-gray-900">{staff.overdueAudits}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm text-gray-900">{staff.rejectedAudits}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Compliance by Category - Stacked Bar Chart */}
                            <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                                <h2 className="mb-4 text-lg font-semibold text-gray-800">Compliance by Category</h2>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={categoryComplianceBarData}
                                        layout="vertical"
                                        margin={{ top: 40, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="category"
                                            width={250}
                                            tick={renderCategoryTick}
                                        />
                                        <Tooltip />
                                        <Bar dataKey="fullyCompliant" stackId="a" fill="#16a34a" name="Fully Compliant" />
                                        <Bar dataKey="partiallyCompliant" stackId="a" fill="#facc15" name="Partially Compliant" />
                                        <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non-Compliant" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex items-center gap-8 mt-8 ml-4">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 rounded bg-green-600"></span>
                                        <span className="text-green-700 font-medium text-sm">Fully Compliant</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 rounded bg-yellow-400"></span>
                                        <span className="text-yellow-700 font-medium text-sm">Partially Compliant</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 rounded bg-red-500"></span>
                                        <span className="text-red-700 font-medium text-sm">Non-Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Regional Compliance Summary and Quick Links */}
                        <div className="space-y-6">
                            {/* Regional Compliance Summary */}
                            <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                                <h2 className="mb-4 text-lg font-semibold text-gray-800">Regional Compliance Summary</h2>
                                
                                {/* Donut Chart Representation */}
                                <div className="mt-4 flex justify-center">
                                    <div className="relative h-48 w-48 flex flex-col items-center justify-center">
                                        <svg viewBox="0 0 36 36" className="h-full w-full">
                                            {/* Background circle */}
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#eee"
                                                strokeWidth="3"
                                            />
                                            {/* Fully Compliant - Green segment */}
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#16a34a"
                                                strokeWidth="3"
                                                strokeDasharray={`${fullyCompliant.percentage * 1.01}, 100`}
                                                strokeLinecap="round"
                                            />
                                            {/* Partially Compliant - Light Green segment */}
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#86efac"
                                                strokeWidth="3"
                                                strokeDasharray={`${partiallyCompliant.percentage * 1.01}, 100`}
                                                strokeDashoffset={`-${fullyCompliant.percentage * 1.01}`}
                                                strokeLinecap="round"
                                            />
                                            {/* Non-Compliant - Red segment */}
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#ef4444"
                                                strokeWidth="3"
                                                strokeDasharray={`${nonCompliant.percentage * 1.01}, 100`}
                                                strokeDashoffset={`-${(fullyCompliant.percentage + partiallyCompliant.percentage) * 1.01}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center gap-0" style={{transform: 'translate(-50%, -50%)'}}>
                                            <span className="text-3xl font-bold text-gray-800 whitespace-nowrap">{fullyCompliant.percentage}%</span>
                                            <span className="text-sm text-gray-600 whitespace-nowrap">Fully Compliant</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex items-center">
                                        <span className="mr-2 h-3 w-3 rounded-full bg-green-600"></span>
                                        <span className="text-sm text-gray-600">Fully Compliant ({fullyCompliant.percentage}%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2 h-3 w-3 rounded-full bg-green-300"></span>
                                        <span className="text-sm text-gray-600">Partially Compliant ({partiallyCompliant.percentage}%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2 h-3 w-3 rounded-full bg-red-500"></span>
                                        <span className="text-sm text-gray-600">Non-Compliant ({nonCompliant.percentage}%)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links Section */}
                            <div className="overflow-hidden bg-white px-6 py-6 shadow-sm sm:rounded-lg">
                                <h2 className="mb-4 text-lg font-semibold text-gray-800">Quick Actions</h2>
                                <div className="flex flex-col space-y-3">
                                    <AdminPrimaryButton className="justify-center" onClick={() => router.visit(route('manager.audits'))}>
                                        Review Submitted Forms
                                    </AdminPrimaryButton>
                                    <AdminPrimaryButton className="justify-center" onClick={() => router.visit(route('manager.users'))}>
                                        View Outlet Staff
                                    </AdminPrimaryButton>
                                    <AdminPrimaryButton className="justify-center" onClick={() => router.visit(route('manager.audits', { tab: 'reports' }))}>
                                        Generate Regional Report
                                    </AdminPrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
