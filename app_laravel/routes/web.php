<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\FormTemplateController;
use App\Http\Controllers\Admin\ComplianceRequirementController;
use App\Http\Controllers\Admin\AuditController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\AuditorController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\Manager\AuditController as ManagerAuditController;
use App\Http\Controllers\Manager\ReportController as ManagerReportController;
use App\Http\Controllers\Manager\AuditHistoryController as ManagerAuditHistoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        // 'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Unified dashboard route that uses DashboardController to handle role-based rendering
Route::get('/dashboard', [DashboardController::class, 'show'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// User management routes - controller handles role-based access
Route::middleware(['auth', 'verified'])->group(function () {
    // Admin Dashboard
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])
        ->name('admin.dashboard');

    // User listing page
    Route::get('/users', [UserController::class, 'index'])
        ->name('users.index');

    // User activity log page
    Route::get('/users/{user}/activity-log', [UserController::class, 'activityLog'])
        ->name('users.activity-log');

    // Audit management pages
    Route::get('/admin/audits', [AuditController::class, 'index'])
        ->name('admin.audits.index');

    // Audit report generation
    Route::match(['get', 'post'], '/admin/audits/generate-report', [AuditController::class, 'generateReport'])
        ->name('admin.audits.generate-report');

    // Share form access page
    Route::get('/audits/share-form/{formId}', function ($formId) {
        return Inertia::render('Admin/Audits/ShareFormAccessPage', [
            'formId' => $formId
        ]);
    })->name('audits.share-form');

    // Compliance Requirements routes
    Route::resource('/admin/compliance-requirements', ComplianceRequirementController::class)
        ->names([
            'index' => 'admin.compliance-requirements.index',
            'store' => 'admin.compliance-requirements.store',
            'update' => 'admin.compliance-requirements.update',
            'destroy' => 'admin.compliance-requirements.destroy',
        ])
        ->except(['create', 'edit', 'show']); // Not needed for inline form handling

    // Form Template routes
    Route::resource('/admin/form-templates', FormTemplateController::class)
        ->names([
            'index' => 'admin.form-templates.index',
            'create' => 'admin.form-templates.create',
            'store' => 'admin.form-templates.store',
            'edit' => 'admin.form-templates.edit',
            'update' => 'admin.form-templates.update',
            'destroy' => 'admin.form-templates.destroy',
        ]);

    // AI-powered Excel import route
    Route::post('/admin/form-templates/import-from-excel', [FormTemplateController::class, 'importFromExcel'])
        ->name('admin.form-templates.import');

    // Settings - Roles & Permissions page
    Route::get('/admin/settings/roles-permissions', function () {
        return Inertia::render('Admin/Settings/RolesPermissionsPage');
    })->name('settings.roles-permissions');

    // Outlet Management Routes
    Route::resource('/admin/outlets', \App\Http\Controllers\Admin\OutletController::class)
        ->names([
            'index' => 'admin.outlets.index',
            'create' => 'admin.outlets.create',
            'store' => 'admin.outlets.store',
            'edit' => 'admin.outlets.edit',
            'update' => 'admin.outlets.update',
            'destroy' => 'admin.outlets.destroy',
        ]);

    // User Management Routes
    Route::resource('/admin/users', \App\Http\Controllers\Admin\UserController::class)
        ->names([
            'index' => 'admin.users.index',
            'create' => 'admin.users.create',
            'store' => 'admin.users.store',
            'edit' => 'admin.users.edit',
            'update' => 'admin.users.update',
            'destroy' => 'admin.users.destroy',
        ]);

    // API routes for outlet user assignment
    Route::get('/admin/outlet-users', [\App\Http\Controllers\Admin\OutletController::class, 'getOutletUsers'])
        ->name('admin.outlet-users');
    Route::get('/admin/managers', [\App\Http\Controllers\Admin\OutletController::class, 'getManagers'])
        ->name('admin.managers');
    // API route for available outlets for user creation
    Route::get('/admin/available-outlets', [\App\Http\Controllers\Admin\OutletController::class, 'availableOutlets'])
        ->name('admin.available-outlets');

    // Manager Routes
    Route::get('/manager/dashboard', [App\Http\Controllers\Manager\DashboardController::class, 'index'])
        ->middleware(['auth', 'verified'])
        ->name('manager.dashboard');
    Route::get('/manager/audits', function () {
        return Inertia::render('Manager/Audits/IndexPage');
    })->name('manager.audits');
    Route::get('/manager/audits-data', [ManagerAuditController::class, 'getManagerAudits']);
    Route::get('/manager/audits/{auditId}/forms', [ManagerAuditController::class, 'getAuditForms']);
    Route::post('/manager/audits/{auditId}/status', [ManagerAuditController::class, 'updateAuditStatus']);
    Route::get('/manager/audits/{auditId}/details', [ManagerAuditController::class, 'getAuditDetails']);
    Route::get('/manager/forms/{formId}/details', [ManagerAuditController::class, 'getAuditFormDetails']);
    Route::post('/manager/forms/{auditForm}/generate-analysis', [ManagerAuditController::class, 'generateFormAnalysis']);
    Route::get('/manager/forms/{formId}/issues', [App\Http\Controllers\Manager\IssueController::class, 'getFormIssues']);
    Route::get('/manager/forms/{formId}/previous-issues', [App\Http\Controllers\Manager\IssueController::class, 'getPreviousFormIssue']);
    Route::post('/manager/forms/{formId}/status', [ManagerAuditController::class, 'updateFormStatus']);
    Route::get('/manager/audits/{id}/rejected-forms-check', [ManagerAuditController::class, 'checkRejectedForms']);
    Route::put('/manager/issues/{id}', [App\Http\Controllers\Manager\IssueController::class, 'updateIssue']);
    Route::delete('/manager/issues/{id}', [App\Http\Controllers\Manager\IssueController::class, 'deleteIssue']);
    Route::get('/manager/issues/{issueId}/corrective-actions', [App\Http\Controllers\Manager\IssueController::class, 'getIssueCorrectiveActions']);
    Route::get('/manager/issues/corrective-actions-count', [App\Http\Controllers\Manager\IssueController::class, 'getCorrectiveActionCounts']);
    Route::get('/manager/audit-history', [ManagerAuditController::class, 'managerAuditHistory'])
        ->name('manager.audit-history.index');

    // User Management Routes for Manager
    Route::get('/manager/users', function () {
        return Inertia::render('Manager/Users/IndexPage');
    })->name('manager.users');

    Route::get('/manager/users/{userId}/activity-log', function ($userId) {
        return Inertia::render('Manager/Users/ActivityLogPage', [
            'userId' => $userId
        ]);
    })->name('manager.users.activity-log');

    Route::get('/manager/reports', function () {
        return Inertia::render('Manager/ReportsPage');
    })->name('manager.reports');

    Route::get('/manager/audits/generate-report', [ManagerReportController::class, 'generateReport'])
        ->name('manager.audits.generate-report');

    // User Management API for Manager
    Route::get('/manager/users/data', [\App\Http\Controllers\Manager\UserController::class, 'index']);

    // Admin routes
    Route::middleware(['auth', 'can:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
        Route::get('/activity-logs/export', [ActivityLogController::class, 'export'])
            ->name('activity-logs.export');
        Route::get('/audits/{auditId}/forms', [App\Http\Controllers\Admin\AuditController::class, 'getAuditForms']);
        Route::get('/audits/{auditId}/details', [App\Http\Controllers\Admin\AuditController::class, 'getAuditDetails']);
        Route::get('/forms/{formId}/details', [App\Http\Controllers\Admin\AuditController::class, 'getAuditFormDetails']);
    });

    // New AJAX routes
    Route::middleware(['auth', 'verified'])->prefix('admin/ajax')->group(function () {
        Route::get('/roles', [RolePermissionController::class, 'roles']);
        Route::post('/roles', [RolePermissionController::class, 'storeRole']);
        Route::post('/roles/{role}/details', [RolePermissionController::class, 'updateRoleDetails']);
        Route::delete('/roles/{role}', [RolePermissionController::class, 'destroyRole']);
        Route::get('/abilities', [RolePermissionController::class, 'abilities']);
        Route::get('/roles/{roleId}/abilities', [RolePermissionController::class, 'getRoleAbilities']);
        Route::put('/roles/{roleId}/abilities', [RolePermissionController::class, 'updateRoleAbilities']);
        // Add other endpoints as needed
    });

    // Admin Issue Endpoints
    Route::get('/admin/forms/{formId}/issues', [App\Http\Controllers\Admin\IssueController::class, 'getFormIssues']);
    Route::get('/admin/forms/{formId}/previous-issues', [App\Http\Controllers\Admin\IssueController::class, 'getPreviousFormIssue']);
    Route::get('/admin/issues/{issueId}/corrective-actions', [App\Http\Controllers\Admin\IssueController::class, 'getIssueCorrectiveActions']);
    Route::get('/admin/issues/corrective-actions-count', [App\Http\Controllers\Admin\IssueController::class, 'getCorrectiveActionCounts']);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Custom auth routes to override Breeze defaults with Admin-themed components
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Admin/Auth/LoginPage');
    })->name('login');

    Route::get('/forgot-password', function () {
        return Inertia::render('Admin/Auth/ForgotPasswordPage');
    })->name('password.request');

    Route::get('/reset-password/{token}', function ($token) {
        return Inertia::render('Admin/Auth/ResetPasswordPage', [
            'token' => $token,
            'email' => request('email'),
        ]);
    })->name('password.reset');
});
Route::get('/auditor/forms/{formId}/details', [AuditorController::class, 'getAuditFormDetails']);
Route::get('/auditor/forms/{formId}/issues', [AuditorController::class, 'getFormIssues']);
Route::get('/auditor/forms/{formId}/previous-issues', [AuditorController::class, 'getPreviousFormIssue']);
Route::get('/auditor/issues/{issueId}/corrective-actions', [IssueController::class, 'getIssueCorrectiveActions']);
    Route::get('/auditor/issues/corrective-actions-count', [IssueController::class, 'getCorrectiveActionCounts']);
Route::get('/auditor/audits/view', [AuditorController::class, 'viewAudit'])
    ->name('auditor.audits.view');
// Include standard auth routes (for POST handlers)
require __DIR__ . '/auth.php';