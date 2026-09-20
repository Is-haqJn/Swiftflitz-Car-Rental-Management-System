@extends('management.layout')

@section('title', 'Dashboard')
@section('heading', 'Dashboard')

@section('content')

{{-- Stat row --}}
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
    <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Environment</span>
            <span class="w-8 h-8 rounded-lg flex items-center justify-center
                {{ $info['environment'] === 'production' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600' }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </span>
        </div>
        <div class="text-xl font-bold text-slate-900 capitalize">{{ $info['environment'] }}</div>
        <div class="text-xs text-slate-400 mt-1">Debug: {{ $info['debug_mode'] ? 'On' : 'Off' }}</div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Jobs</span>
            <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </span>
        </div>
        <div class="text-3xl font-bold {{ $queue['pending_jobs'] > 0 ? 'text-amber-600' : 'text-slate-900' }}">
            {{ $queue['pending_jobs'] }}
        </div>
        <div class="text-xs text-slate-400 mt-1">Awaiting worker</div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Jobs</span>
            <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </span>
        </div>
        <div class="text-3xl font-bold {{ $queue['failed_jobs'] > 0 ? 'text-rose-600' : 'text-slate-900' }}">
            {{ $queue['failed_jobs'] }}
        </div>
        <div class="text-xs text-slate-400 mt-1">Need attention</div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Logs</span>
            <span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </span>
        </div>
        <div class="text-3xl font-bold {{ count($criticalLogs) > 0 ? 'text-purple-600' : 'text-slate-900' }}">
            {{ count($criticalLogs) }}
        </div>
        <div class="text-xs text-slate-400 mt-1">Recent errors</div>
    </div>

    @php
        $workerColors = [
            'running' => ['icon' => 'bg-emerald-50 text-emerald-600', 'badge' => 'bg-emerald-100 text-emerald-700 border-emerald-200', 'dot' => 'bg-emerald-500'],
            'stopped' => ['icon' => 'bg-rose-50 text-rose-600',   'badge' => 'bg-rose-100 text-rose-700 border-rose-200',     'dot' => 'bg-rose-500'],
            'unknown' => ['icon' => 'bg-slate-100 text-slate-500', 'badge' => 'bg-slate-100 text-slate-600 border-slate-200', 'dot' => 'bg-slate-400'],
        ];
        $wc = $workerColors[$workerStatus] ?? $workerColors['unknown'];
        $workerLabel = ucfirst($workerStatus);
    @endphp
    <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Worker</span>
            <span class="w-8 h-8 rounded-lg flex items-center justify-center {{ $wc['icon'] }}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
            </span>
        </div>
        <div class="flex items-center gap-2 mt-1">
            <span class="w-2.5 h-2.5 rounded-full {{ $wc['dot'] }} {{ $workerStatus === 'running' ? 'animate-pulse' : '' }}"></span>
            <span class="text-xl font-bold text-slate-900">{{ $workerLabel }}</span>
        </div>
        <div class="mt-2">
            <span class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border {{ $wc['badge'] }}">
                @if ($workerStatus === 'running') Heartbeat detected
                @elseif ($workerStatus === 'stopped') No heartbeat (&gt;90s)
                @else Never detected
                @endif
            </span>
        </div>
    </div>
</div>

{{-- Middle row: queue actions + quick links + system info + site branding --}}
<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
    {{-- Queue actions --}}
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </div>
            <h2 class="text-sm font-semibold text-slate-800">Queue Management</h2>
        </div>
        <p class="text-xs text-slate-500 mb-4 leading-relaxed">
            Retry failed jobs, clear the failed queue, or signal workers to restart gracefully.
        </p>
        <div class="space-y-2">
            <form method="POST" action="{{ route('management.queue.retry') }}">
                @csrf
                <button type="submit"
                    class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                    <span>Retry Failed</span>
                    <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </button>
            </form>
            <form method="POST" action="{{ route('management.queue.flush') }}"
                onsubmit="return confirm('Clear all failed jobs? This cannot be undone.');">
                @csrf
                <button type="submit"
                    class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-medium transition">
                    <span>Clear Failed</span>
                    <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </form>
            <form method="POST" action="{{ route('management.queue.restart') }}">
                @csrf
                <button type="submit"
                    class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium transition">
                    <span>Restart Workers</span>
                    <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                </button>
            </form>
        </div>
    </div>

    {{-- Quick links --}}
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
            </div>
            <h2 class="text-sm font-semibold text-slate-800">Quick Links</h2>
        </div>
        <div class="space-y-2">
            <a href="{{ url('/telescope') }}" target="_blank"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-sm group transition">
                <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-200 transition">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                    </div>
                    <span class="font-medium text-slate-700">Telescope</span>
                </div>
                <span class="text-slate-400 group-hover:text-indigo-500 transition">&#x2197;</span>
            </a>
            <a href="{{ route('management.profile') }}"
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-sm group transition">
                <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center transition">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                    </div>
                    <span class="font-medium text-slate-700">Profile</span>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
    </div>

    {{-- System info --}}
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
            </div>
            <h2 class="text-sm font-semibold text-slate-800">System Info</h2>
        </div>
        <dl class="space-y-2.5">
            @foreach ([
                'PHP' => $info['php_version'],
                'Laravel' => $info['laravel_version'],
                'Database' => $info['database_driver'],
                'Cache' => $info['cache_driver'],
                'Queue' => $info['queue_driver'],
                'Timezone' => $info['timezone'],
            ] as $label => $value)
            <div class="flex items-center justify-between text-sm">
                <dt class="text-slate-500 text-xs uppercase tracking-wider font-medium">{{ $label }}</dt>
                <dd class="font-semibold text-slate-800 text-xs">{{ $value }}</dd>
            </div>
            @endforeach
        </dl>
    </div>

    {{-- Site Branding --}}
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </div>
            <h2 class="text-sm font-semibold text-slate-800">Site Logo</h2>
        </div>

        <div class="mb-4 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4" style="min-height:5rem;">
            @if ($managementLogoUrl)
                <img src="{{ $managementLogoUrl }}" alt="Management logo" class="max-h-12 max-w-full object-contain">
            @else
                <span class="text-xs text-slate-400">No logo set - developer name shown</span>
            @endif
        </div>

        <form method="POST" action="{{ route('management.logo.upload') }}" enctype="multipart/form-data" class="space-y-2">
            @csrf
            <input type="file" name="logo" accept="image/*" required
                class="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100">
            <button type="submit"
                class="w-full px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition">
                Upload Logo
            </button>
        </form>

        @if ($managementLogoUrl)
            <form method="POST" action="{{ route('management.logo.delete') }}" class="mt-2"
                onsubmit="return confirm('Remove the management logo?');">
                @csrf
                @method('DELETE')
                <button type="submit"
                    class="w-full px-4 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition">
                    Remove Logo
                </button>
            </form>
        @endif
    </div>
</div>

{{-- Critical logs --}}
<div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <div>
                <h2 class="text-sm font-semibold text-slate-800">Critical Logs</h2>
                <p class="text-xs text-slate-400">ERROR, CRITICAL, ALERT, EMERGENCY entries</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            @if (count($criticalLogs) > 0)
                <select id="logs-per-page" onchange="applyLogsPerPage(this.value)"
                    style="font-size:0.75rem; padding:0.25rem 0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; background:#fff; color:#475569; cursor:pointer; outline:none;">
                    <option value="10">10 / page</option>
                    <option value="15" selected>15 / page</option>
                    <option value="20">20 / page</option>
                    <option value="9999">All</option>
                </select>
                <span id="logs-count-badge" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                    {{ count($criticalLogs) }} entries
                </span>
            @endif
        </div>
    </div>

    @if (count($criticalLogs) === 0)
        <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <p class="text-sm font-medium text-slate-700">No critical errors found</p>
            <p class="text-xs text-slate-400 mt-1">System log is clean</p>
        </div>
    @else
        <div id="logs-list" class="divide-y divide-slate-50">
            @foreach ($criticalLogs as $entry)
                @php
                    $colors = [
                        'ERROR'     => ['bg' => 'bg-rose-50',   'text' => 'text-rose-700',   'border' => 'border-rose-200'],
                        'CRITICAL'  => ['bg' => 'bg-orange-50', 'text' => 'text-orange-700', 'border' => 'border-orange-200'],
                        'ALERT'     => ['bg' => 'bg-amber-50',  'text' => 'text-amber-700',  'border' => 'border-amber-200'],
                        'EMERGENCY' => ['bg' => 'bg-red-50',    'text' => 'text-red-800',    'border' => 'border-red-300'],
                    ];
                    $c = $colors[$entry['level']] ?? $colors['ERROR'];
                @endphp
                <div class="log-entry flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 transition">
                    <span class="mt-0.5 shrink-0 text-xs font-bold px-2 py-0.5 rounded-md border {{ $c['bg'] }} {{ $c['text'] }} {{ $c['border'] }}">
                        {{ $entry['level'] }}
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm text-slate-700 truncate">{{ $entry['message'] }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ $entry['timestamp'] }}</p>
                    </div>
                </div>
            @endforeach
        </div>
        <div id="logs-show-more" class="hidden px-6 py-3 border-t border-slate-50 text-center">
            <button onclick="applyLogsPerPage(document.getElementById('logs-per-page').value, true)"
                class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Show all <span id="logs-hidden-count"></span> remaining entries
            </button>
        </div>
    @endif
</div>

<script>
function applyLogsPerPage(perPage, showAll) {
    const entries = document.querySelectorAll('#logs-list .log-entry');
    const limit = showAll ? Infinity : parseInt(perPage, 10);
    let hidden = 0;
    entries.forEach(function(el, i) {
        if (i < limit) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
            hidden++;
        }
    });
    const moreEl = document.getElementById('logs-show-more');
    const hiddenCountEl = document.getElementById('logs-hidden-count');
    if (moreEl) {
        moreEl.className = hidden > 0 ? 'px-6 py-3 border-t border-slate-50 text-center' : 'hidden';
    }
    if (hiddenCountEl) {
        hiddenCountEl.textContent = hidden > 0 ? '(' + hidden + ')' : '';
    }
}
document.addEventListener('DOMContentLoaded', function() { applyLogsPerPage(15); });
</script>

@endsection
