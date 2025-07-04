<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Audit;
use App\Models\Status;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            // Get all statuses in one query
            $statuses = Status::all()->keyBy('name');

            // Get all audits in one query
            $audits = Audit::whereNotNull('end_time')
                ->whereNotNull('start_time')
                ->whereBetween('end_time', ['2025-06-01 00:00:00', '2025-06-30 23:59:59'])
                ->get();

            $averageCompletionTime = $audits
                ->filter(function ($audit) {
                    $start = \Carbon\Carbon::parse($audit->start_time)->setTimezone('UTC');
                    $end = \Carbon\Carbon::parse($audit->end_time)->setTimezone('UTC');
                    return $end->greaterThanOrEqualTo($start);
                })
                ->avg(function ($audit) {
                    $start = \Carbon\Carbon::parse($audit->start_time)->setTimezone('UTC');
                    $end = \Carbon\Carbon::parse($audit->end_time)->setTimezone('UTC');
                    return $start->diffInSeconds($end) / 3600;
                });

            $statistics = [
                'totalOutlets' => Outlet::where('is_active', true)->count(),
                'activeUsers' => User::where('email_verified_at', '!=', null)->count(),
                'averageCompletionTime' => $averageCompletionTime > 0 ? $averageCompletionTime : 0,
                'pendingReviews' => Audit::where('status_id', $statuses['pending']->id ?? null)->count()
            ];

            // Get compliance data
            $complianceData = [
                'fullyCompliant' => [
                    'count' => Audit::where('status_id', $statuses['approved']->id ?? null)
                        ->where('created_at', '>=', Carbon::now()->startOfMonth())
                        ->count(),
                    'percentage' => 0
                ],
                'partiallyCompliant' => [
                    'count' => Audit::whereIn('status_id', [
                        $statuses['pending']->id ?? null,
                        $statuses['rejected']->id ?? null
                    ])
                        ->where('created_at', '>=', Carbon::now()->startOfMonth())
                        ->count(),
                    'percentage' => 0
                ],
                'nonCompliant' => [
                    'count' => Audit::where('status_id', $statuses['draft']->id ?? null)
                        ->where('created_at', '>=', Carbon::now()->startOfMonth())
                        ->count(),
                    'percentage' => 0
                ]
            ];

            // Calculate total audits for this month
            $totalAudits = array_sum(array_column($complianceData, 'count'));

            // Calculate percentages if there are audits
            if ($totalAudits > 0) {
                $complianceData['fullyCompliant']['percentage'] = round(($complianceData['fullyCompliant']['count'] / $totalAudits) * 100);
                $complianceData['partiallyCompliant']['percentage'] = round(($complianceData['partiallyCompliant']['count'] / $totalAudits) * 100);
                $complianceData['nonCompliant']['percentage'] = round(($complianceData['nonCompliant']['count'] / $totalAudits) * 100);
            }

            // Get recent activities
            $recentActivities = ActivityLog::with('user')
                ->latest('created_at')
                ->take(20) // fetch more to ensure all related events are included
                ->get()
                ->sort(function ($a, $b) {
                    $cmp = strcmp($b->created_at, $a->created_at);
                    if ($cmp !== 0) return $cmp;
                    $priority = function ($activity) {
                        if (str_contains($activity->details, 'was assigned to outlet')) return 1;
                        if (str_contains($activity->details, 'was created')) return 2;
                        return 3;
                    };
                    return $priority($a) <=> $priority($b);
                })
                ->values()
                ->take(5) // now take the top 5 after sorting
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'description' => $activity->details,
                        'time' => Carbon::parse($activity->created_at)->diffForHumans()
                    ];
                });

            return Inertia::render('Admin/DashboardPage', [
                'statistics' => $statistics,
                'complianceData' => $complianceData,
                'recentActivities' => $recentActivities
            ]);
        } catch (\Exception $e) {
            return Inertia::render('Admin/DashboardPage', [
                'statistics' => [],
                'complianceData' => [],
                'recentActivities' => []
            ]);
        }
    }
}
