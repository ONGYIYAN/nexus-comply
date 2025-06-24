<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Observers\ActivityLogObserver;
use App\Models\User;
use App\Models\Outlet;
use App\Models\Audit;
use App\Models\ComplianceRequirement;
use Silber\Bouncer\BouncerServiceProvider;
use Illuminate\Support\Facades\Route;
use Silber\Bouncer\Middleware\RoleMiddleware;
use App\Models\FormTemplate;
use App\Models\AuditForm;
use App\Models\Role;
use Illuminate\Support\Facades\Schema;
use Silber\Bouncer\Bouncer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->register(BouncerServiceProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production
    if (env('APP_ENV') === 'production') {
        $this->app['request']->server->set('HTTPS', true);
    }
        Vite::prefetch(concurrency: 3);

        Schema::defaultStringLength(191);

        // Register activity log observers
        User::observe(ActivityLogObserver::class);
        Outlet::observe(ActivityLogObserver::class);
        Audit::observe(ActivityLogObserver::class);
        ComplianceRequirement::observe(ActivityLogObserver::class);
        FormTemplate::observe(ActivityLogObserver::class);
        AuditForm::observe(ActivityLogObserver::class);
        Role::observe(ActivityLogObserver::class);

        // Register Bouncer middleware
        $this->app->afterResolving(Bouncer::class, function ($bouncer) {
            $bouncer->useRoleModel(\App\Models\Role::class);
            $bouncer->useRoleMiddleware('role');
        });
    }
}
