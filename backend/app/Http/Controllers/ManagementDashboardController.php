<?php

namespace App\Http\Controllers;

use App\Services\Contracts\SystemServiceInterface;
use App\Settings\ManagementSettings;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ManagementDashboardController extends Controller
{
    public function __construct(private readonly SystemServiceInterface $systemService) {}

    public function index(): View
    {
        $info = $this->systemService->getInfo();
        $queue = $this->systemService->getQueueStatus();
        $workerStatus = $this->systemService->getWorkerStatus();
        $criticalLogs = $this->parseCriticalLogs(100);
        $managementSettings = app(ManagementSettings::class);

        return view('management.dashboard', [
            'info' => $info,
            'queue' => $queue,
            'workerStatus' => $workerStatus,
            'criticalLogs' => $criticalLogs,
            'managementLogoUrl' => $managementSettings->management_logo_url,
        ]);
    }

    public function uploadLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
        ]);

        $settings = app(ManagementSettings::class);

        if ($settings->management_logo_url) {
            $existing = str_replace(Storage::disk('public')->url(''), '', $settings->management_logo_url);
            if (Storage::disk('public')->exists($existing)) {
                Storage::disk('public')->delete($existing);
            }
        }

        $path = $request->file('logo')->store('management-logos', 'public');
        $settings->management_logo_url = Storage::disk('public')->url($path);
        $settings->save();

        return redirect()
            ->route('management.dashboard')
            ->with('status', 'Management logo updated.');
    }

    public function deleteLogo(): RedirectResponse
    {
        $settings = app(ManagementSettings::class);

        if ($settings->management_logo_url) {
            $existing = str_replace(Storage::disk('public')->url(''), '', $settings->management_logo_url);
            if (Storage::disk('public')->exists($existing)) {
                Storage::disk('public')->delete($existing);
            }
        }

        $settings->management_logo_url = null;
        $settings->save();

        return redirect()
            ->route('management.dashboard')
            ->with('status', 'Management logo removed.');
    }

    public function retryQueue(): RedirectResponse
    {
        $this->systemService->retryFailedJobs();

        return redirect()
            ->route('management.dashboard')
            ->with('status', 'Failed jobs queued for retry.');
    }

    public function flushQueue(): RedirectResponse
    {
        $this->systemService->flushFailedJobs();

        return redirect()
            ->route('management.dashboard')
            ->with('status', 'Failed jobs cleared.');
    }

    public function restartQueue(): RedirectResponse
    {
        $this->systemService->restartQueue();

        return redirect()
            ->route('management.dashboard')
            ->with('status', 'Queue workers will restart on next tick.');
    }

    /**
     * @return array<int, array{level: string, message: string, context: string, timestamp: string}>
     */
    private function parseCriticalLogs(int $limit = 50): array
    {
        $logFile = storage_path('logs/laravel.log');

        if (! file_exists($logFile)) {
            return [];
        }

        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if (! $lines) {
            return [];
        }

        $critical = ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'];
        $pattern = '/^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]\s+\w+\.(' . implode('|', $critical) . '):\s+(.+?)(?:\s+\{.+)?$/i';

        $entries = [];

        foreach (array_reverse($lines) as $line) {
            if (! preg_match($pattern, $line, $m)) {
                continue;
            }

            $entries[] = [
                'timestamp' => $m[1],
                'level' => strtoupper($m[2]),
                'message' => mb_strimwidth(trim($m[3]), 0, 200, '...'),
                'context' => '',
            ];

            if (count($entries) >= $limit) {
                break;
            }
        }

        return $entries;
    }
}
