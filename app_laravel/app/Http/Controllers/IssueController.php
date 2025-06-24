<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\AuditForm;
use App\Models\AuditVersion;
use App\Models\Issue;
use App\Models\Status;

class IssueController extends Controller
{
    public function getPreviousFormIssue(Request $request, $auditFormId)
    {
        try {
            // Get form and audit information in a single query
            $formInfo = DB::table('audit_form')
                ->join('audit_audit_form', 'audit_form.id', '=', 'audit_audit_form.audit_form_id')
                ->join('audit_version', 'audit_audit_form.audit_id', '=', 'audit_version.audit_id')
                ->where('audit_form.id', $auditFormId)
                ->select('audit_form.form_id', 'audit_version.first_audit_id', 'audit_version.audit_version')
                ->first();
                
            // If no form found or it's the first version (no previous version)
            if (!$formInfo || $formInfo->audit_version < 2) {
                return response()->json([
                    'success' => true,
                    'message' => 'No previous version exists for this form',
                    'data' => []
                ]);
            }
                
            // Find the previous version form and its issues in a single query
            $previousIssues = DB::table('audit_version AS prev_ver')
                ->where('prev_ver.first_audit_id', $formInfo->first_audit_id)
                ->where('prev_ver.audit_version', $formInfo->audit_version - 1)
                ->join('audit_audit_form AS prev_aaf', 'prev_ver.audit_id', '=', 'prev_aaf.audit_id')
                ->join('audit_form AS prev_form', 'prev_aaf.audit_form_id', '=', 'prev_form.id')
                ->where('prev_form.form_id', $formInfo->form_id)
                ->join('issue', 'prev_form.id', '=', 'issue.audit_form_id')
                ->leftJoin('status', 'issue.status_id', '=', 'status.id')
                ->select(
                    'issue.id',
                    'issue.description',
                    'issue.severity',
                    'issue.due_date',
                    'issue.created_at',
                    'issue.updated_at',
                    'status.name as status',
                )
                ->get();
                
            return response()->json([
                'success' => true,
                'message' => 'Previous version issues retrieved',
                'data' => $previousIssues
            ]);
                
        } catch (\Exception $e) {
            Log::error('Error retrieving previous issues: ' . $e->getMessage(), [
                'form_id' => $auditFormId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch previous version issues',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
    /**
     * Get issues for an audit form
     * 
     * @param int $formId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFormIssues($formId)
    {
        try {
            $issues = Issue::where('audit_form_id', $formId)
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json([
                'success' => true,
                'data' => $issues
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching issues: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update the specified issue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateIssue(Request $request, $id)
    {
        try {
            $issue = Issue::findOrFail($id);
            
            $validated = $request->validate([
                'description' => 'required|string',
                'severity' => 'required|string|in:Low,Medium,High,Critical',
                'due_date' => 'required|date|after_or_equal:today',
            ]);
            
            $issue->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Issue updated successfully',
                'issue' => $issue
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update issue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified issue.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteIssue($id)
    {
        try {
            $issue = Issue::findOrFail($id);
            $issue->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Issue deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete issue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete issue',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get corrective actions for an issue
     * 
     * @param int $issueId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getIssueCorrectiveActions($issueId)
    {
        try {
            // Verify the issue exists
            $issue = Issue::findOrFail($issueId);
            
            // Get corrective actions for the issue, selecting all fields except status_id
            // But including the status name through a relationship
            $correctiveActions = DB::table('corrective_actions')
                ->where('issue_id', $issueId)
                ->select(
                    'corrective_actions.id',
                    'corrective_actions.description',
                    'corrective_actions.completion_date',
                    'corrective_actions.verification_date',
                    'corrective_actions.created_at',
                    'corrective_actions.updated_at',
                    'corrective_actions.issue_id',
                )
                ->orderBy('corrective_actions.created_at', 'desc')
                ->get();
                
            return response()->json([
                'success' => true,
                'data' => $correctiveActions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching corrective actions: ' . $e->getMessage(), [
                'issue_id' => $issueId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching corrective actions: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get corrective action counts for multiple issues
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCorrectiveActionCounts(Request $request)
    {
        try {
            $issueIds = explode(',', $request->input('issueIds'));
            
            $counts = [];
            foreach ($issueIds as $issueId) {
                $count = DB::table('corrective_actions')
                    ->where('issue_id', $issueId)
                    ->count();
                
                $counts[$issueId] = $count;
            }
            
            return response()->json([
                'success' => true,
                'data' => $counts
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching corrective action counts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching counts',
                'data' => []
            ], 500);
        }
    }
}