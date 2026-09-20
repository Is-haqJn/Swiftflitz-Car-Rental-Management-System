<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Management') - {{ config('app.developer') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
    @auth
        <div class="min-h-screen flex">
            {{-- Sidebar --}}
            <aside class="w-60 bg-slate-900 text-slate-100 flex flex-col">
                <div class="px-6 py-5 border-b border-slate-800">
                    @php
                        $sidebarLogo = null;
                        try { $sidebarLogo = app(\App\Settings\ManagementSettings::class)->management_logo_url; } catch (\Throwable $e) {}
                    @endphp
                    @if ($sidebarLogo)
                        <img src="{{ $sidebarLogo }}" alt="{{ config('app.developer') }}" style="max-height:2rem; max-width:100%; object-fit:contain; margin-bottom:0.25rem;">
                    @else
                        <div class="text-lg font-bold tracking-tight">{{ config('app.developer') }}</div>
                    @endif
                    <div class="text-xs text-slate-400 mt-0.5">Management Console</div>
                </div>

                <nav class="flex-1 px-3 py-4 space-y-1 text-sm">
                    @php($active = fn ($route) => request()->routeIs($route) ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')
                    <a href="{{ route('management.dashboard') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg {{ $active('management.dashboard') }}">
                        <span>Dashboard</span>
                    </a>
                    <a href="{{ route('management.profile') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg {{ $active('management.profile') }}">
                        <span>Profile</span>
                    </a>
                    <a href="{{ url('/telescope') }}" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white">
                        <span>Telescope</span>
                        <span class="text-xs text-slate-500 ml-auto">&#x2197;</span>
                    </a>
                </nav>

                <div class="px-3 py-4 border-t border-slate-800">
                    <form method="POST" action="{{ route('management.logout') }}">
                        @csrf
                        <button type="submit" class="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white text-sm">
                            Logout
                        </button>
                    </form>
                </div>
            </aside>

            {{-- Main --}}
            <main class="flex-1 flex flex-col">
                <header class="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <h1 class="text-lg font-semibold text-slate-800">@yield('heading')</h1>
                    <div class="flex items-center gap-4">
                        @php($user = auth()->user())
                        <div class="flex items-center gap-3">
                            @if ($user->profile_photo_path)
                                <img src="{{ asset('storage/' . $user->profile_photo_path) }}" alt="avatar" class="w-9 h-9 rounded-full object-cover border border-slate-200">
                            @else
                                <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                                    {{ strtoupper(substr($user->name, 0, 1)) }}
                                </div>
                            @endif
                            <div class="text-sm">
                                <div class="font-medium text-slate-800">{{ $user->name }}</div>
                                <div class="text-xs text-slate-500">{{ $user->email }}</div>
                            </div>
                        </div>
                        <form method="POST" action="{{ route('management.logout') }}">
                            @csrf
                            <button type="submit"
                                style="display:inline-flex; align-items:center; gap:0.375rem; padding:0.4rem 0.875rem; border-radius:0.5rem; border:1px solid #fca5a5; background:#fff1f2; color:#dc2626; font-size:0.8rem; font-weight:500; cursor:pointer;"
                                onmouseover="this.style.background='#fee2e2';" onmouseout="this.style.background='#fff1f2';">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                                Logout
                            </button>
                        </form>
                    </div>
                </header>

                <div class="flex-1 p-8">
                    @if (session('status'))
                        <div class="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                            {{ session('status') }}
                        </div>
                    @endif

                    @if ($errors->any())
                        <div class="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm">
                            <ul class="list-disc pl-5 space-y-1">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    @yield('content')
                </div>
            </main>
        </div>
    @else
        @yield('content')
    @endauth
</body>
</html>
