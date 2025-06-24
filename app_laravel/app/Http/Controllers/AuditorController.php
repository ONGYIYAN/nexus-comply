<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AuditorController extends Controller
{
    /**
     * Handle temporary access to view audit via QR code
     */
    public function viewAudit(Request $request)
    {
        // Get parameters from URL
        $auditId = $request->query('id');
        $timestamp = $request->query('timestamp'); // Make sure this is passed in URL
        $expires = $request->query('expires');
        $token = $request->query('token');

        // Add debug logging
        Log::info('Audit view request', [
            'id' => $auditId,
            'timestamp' => $timestamp,
            'expires' => $expires,
            'token' => $token
        ]);

        // Check if token has expired - return a simple error
        if (time() > $expires) {
            return response('Access Expired: This temporary access link has expired. Please request a new QR code.', 403)
                ->header('Content-Type', 'text/plain');
        }

        // Verify token - calculate expected token for comparison
        if (empty($timestamp)) {
            Log::warning('Missing timestamp parameter in URL');
            $timestamp = 'missing'; // Use a placeholder to avoid -- in the token
        }

        // Now create the token exactly as done in JavaScript
        $expectedToken = base64_encode("$auditId-$timestamp-$expires");

        // Add more verbose logging
        Log::info('Token components', [
            'auditId' => $auditId,
            'timestamp' => $timestamp,
            'expires' => $expires,
            'raw_string' => "$auditId-$timestamp-$expires",
            'encoded' => $expectedToken
        ]);

        // If token doesn't match, return error with debug info
        if ($token !== $expectedToken) {
            return response('Invalid Access: The access token is invalid or has been tampered with.' .
                "\n\nDebug Info:\nExpected Token: " . $expectedToken .
                "\nProvided Token: " . $token, 403)
                ->header('Content-Type', 'text/plain');
        }

        try {
            // Get audit details
            $audit = DB::table('audit')
                ->join('outlets', 'audit.outlet_id', '=', 'outlets.id')
                ->join('status', 'audit.status_id', '=', 'status.id')
                ->leftJoin('compliance_requirements', 'audit.compliance_id', '=', 'compliance_requirements.id')
                ->where('audit.id', $auditId)
                ->select('audit.*', 'outlets.name as outletName', 'compliance_requirements.title as auditType', 'status.name as status')
                ->first();

            if (!$audit) {
                return response('Audit Not Found: The requested audit could not be found.', 404)
                    ->header('Content-Type', 'text/plain');
            }

            // Get all forms for this audit
            $forms = DB::table('audit_form')
                ->join('audit_audit_form', 'audit_form.id', '=', 'audit_audit_form.audit_form_id')
                ->join('status', 'audit_form.status_id', '=', 'status.id')
                ->join('audit', 'audit_audit_form.audit_id', '=', 'audit.id')
                ->join('outlets', 'audit.outlet_id', '=', 'outlets.id')
                ->where('audit_audit_form.audit_id', $auditId)
                ->select('audit_form.*', 'audit_form.status_id', 'status.name as status', 'outlets.name as outletName')
                ->get();

            // Find the most recent audit report for this audit
            $auditReport = DB::table('audit_report')
                ->where('audit_id', $audit->id)
                ->orderBy('created_at', 'desc')
                ->first();

            // Make sure this matches your actual Inertia page component name
            return Inertia::render('Auditor/IndexPage', [
                'audit' => $audit,
                'forms' => $forms,
                'temporaryAccess' => true,
                'expiresAt' => $expires,
                // Add these new props:
                'auditReportExists' => !empty($auditReport),
                'auditReportPath' => $auditReport ? $auditReport->path : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error displaying temporary audit access: ' . $e->getMessage(), [
                'audit_id' => $auditId,
                'trace' => $e->getTraceAsString()
            ]);

            // Return a simple error
            return response('Error Occurred: ' . $e->getMessage(), 500)
                ->header('Content-Type', 'text/plain');
        }
    }

    /**
     * Get form details with its values
     *
     * @param int $formId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuditFormDetails($formId)
    {
        try {
            Log::info('Fetching details for form ID: ' . $formId);

            // Get the form details
            $form = DB::table('audit_form')
                ->join('form_templates', 'audit_form.form_id', '=', 'form_templates.id')
                ->leftJoin('status', 'audit_form.status_id', '=', 'status.id')
                ->leftJoin('audit_audit_form', 'audit_form.id', '=', 'audit_audit_form.audit_form_id')
                ->leftJoin('audit', 'audit_audit_form.audit_id', '=', 'audit.id')
                ->leftJoin('outlets', 'audit.outlet_id', '=', 'outlets.id')
                ->where('audit_form.id', $formId)
                ->select(
                    'audit_form.id',
                    'audit_form.name as formName',
                    'form_templates.name as templateName',
                    'audit_form.value as formValues',
                    'form_templates.structure as formStructure',
                    'audit_form.ai_analysis as aiAnalysis',
                    'audit_form.status_id', // Include raw status_id
                    'status.name as status',
                    'outlets.name as outletName',
                    'audit.id as auditId',
                    'audit_form.created_at as createdAt',
                    'audit_form.updated_at as updatedAt'
                )
                ->first();

            if (!$form) {
                return response()->json(['error' => 'Form not found'], 404);
            }

            // Process form values and structure if needed
            $formValues = null;
            $formStructure = null;

            if ($form->formValues) {
                $formValues = json_decode($form->formValues, true);
            }

            if ($form->formStructure) {
                $formStructure = json_decode($form->formStructure, true);
            }

            // Create a combined structure with mapped values
            $combinedForm = [];

            if ($formStructure && is_array($formStructure) && $formValues) {
                $combinedForm = $this->mapFormStructureWithValues($formStructure, $formValues);
            }

            return response()->json([
                'form' => $form,
                'combinedForm' => $combinedForm
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getAuditFormDetails: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     /**
     * Map form structure elements with their corresponding values
     * 
     * @param array $structure The form structure array
     * @param array $values The form values array
     * @return array Combined structure with values
     */
    private function mapFormStructureWithValues($structure, $values)
    {
        $result = [];

        foreach ($structure as $element) {
            $elementId = $element['id'];

            // Create a new element with structure and value
            $mappedElement = $element;

            // Find the value for this element if it exists
            if (array_key_exists($elementId, $values)) {
                $mappedElement['value'] = $values[$elementId];
            } else {
                // Set default value based on input type
                switch ($element['type']) {
                    case 'checkbox':
                        $mappedElement['value'] = false;
                        break;
                    case 'checkbox-group':
                    case 'radio-group':
                        $mappedElement['value'] = [];
                        break;
                    default:
                        $mappedElement['value'] = null;
                }
            }

            $result[] = $mappedElement;
        }

        // Sort by the order field if it exists
        usort($result, function ($a, $b) {
            return ($a['order'] ?? 0) - ($b['order'] ?? 0);
        });

        return $result;
    }
}
