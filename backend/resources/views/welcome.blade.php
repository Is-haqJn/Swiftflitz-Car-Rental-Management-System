<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.developer') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; }
    </style>
</head>
<body style="background:#0f172a; min-height:100vh; display:flex; flex-direction:column;">

    <div style="position:fixed; inset:0; overflow:hidden; pointer-events:none;">
        <div style="position:absolute; top:-20%; left:-10%; width:600px; height:600px; border-radius:50%;
            background:radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);"></div>
        <div style="position:absolute; bottom:-10%; right:-5%; width:500px; height:500px; border-radius:50%;
            background:radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);"></div>
        <div style="position:absolute; top:40%; left:50%; width:400px; height:400px; border-radius:50%;
            background:radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%); transform:translateX(-50%);"></div>
    </div>

    <nav style="position:relative; z-index:10; padding:1.5rem 2rem; display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto; width:100%; box-sizing:border-box;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
            @php
                $logoUrl = null;
                try {
                    $logoUrl = app(\App\Settings\GeneralSettings::class)->logo_url;
                } catch (\Throwable $e) {}
            @endphp
            @if ($logoUrl)
                <img src="{{ $logoUrl }}" alt="{{ config('app.developer') }}" style="height:2rem; width:auto; object-fit:contain;">
            @else
                <div style="width:2rem; height:2rem; border-radius:0.5rem; background:rgba(99,102,241,0.9); display:flex; align-items:center; justify-content:center;">
                    <svg width="16" height="16" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
            @endif
            <span style="color:#f1f5f9; font-weight:600; font-size:1rem;">{{ config('app.developer') }}</span>
        </div>
        @auth
            <a href="{{ route('management.dashboard') }}"
                style="color:rgba(148,163,184,0.8); font-size:0.875rem; text-decoration:none;"
                onmouseover="this.style.color='#f1f5f9';" onmouseout="this.style.color='rgba(148,163,184,0.8)';">
                Go to Dashboard
            </a>
        @else
            <a href="{{ route('management.login') }}"
                style="color:rgba(148,163,184,0.8); font-size:0.875rem; text-decoration:none;"
                onmouseover="this.style.color='#f1f5f9';" onmouseout="this.style.color='rgba(148,163,184,0.8)';">
                Sign in
            </a>
        @endauth
    </nav>

    <main style="position:relative; z-index:10; flex:1; display:flex; align-items:center; justify-content:center; padding:4rem 2rem; text-align:center;">
        <div style="max-width:680px;">
            <div style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.375rem 0.875rem; border-radius:999px; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25); margin-bottom:2rem;">
                <span style="width:6px; height:6px; border-radius:50%; background:#22c55e; display:inline-block;"></span>
                <span style="color:rgba(165,180,252,0.9); font-size:0.78rem; font-weight:500; letter-spacing:0.03em;">System operational</span>
            </div>

            <h1 style="color:#f8fafc; font-size:clamp(2.2rem, 5vw, 3.5rem); font-weight:800; line-height:1.15; letter-spacing:-0.02em; margin:0 0 1.25rem;">
                {{ config('app.developer') }}
            </h1>

            <p style="color:rgba(148,163,184,0.85); font-size:1.05rem; line-height:1.7; margin:0 0 2.5rem; max-width:520px; margin-left:auto; margin-right:auto;">
                A complete car rental management platform. Handle bookings, fleet, payments, and customer records from one place.
            </p>

            @auth
                <a href="{{ route('management.dashboard') }}"
                    style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.8rem 1.75rem; border-radius:0.75rem; background:#4f46e5; color:#fff; font-weight:600; font-size:0.9rem; text-decoration:none; box-shadow:0 4px 20px rgba(79,70,229,0.35);"
                    onmouseover="this.style.background='#4338ca';" onmouseout="this.style.background='#4f46e5';">
                    Go to Dashboard
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                </a>
            @else
                <a href="{{ route('management.login') }}"
                    style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.8rem 1.75rem; border-radius:0.75rem; background:#4f46e5; color:#fff; font-weight:600; font-size:0.9rem; text-decoration:none; box-shadow:0 4px 20px rgba(79,70,229,0.35);"
                    onmouseover="this.style.background='#4338ca';" onmouseout="this.style.background='#4f46e5';">
                    Management Console
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                </a>
            @endauth
        </div>
    </main>

    <section style="position:relative; z-index:10; padding:3rem 2rem; max-width:1200px; margin:0 auto; width:100%; box-sizing:border-box;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem;">
            @foreach ([
                ['icon' => 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'label' => 'Rental Management'],
                ['icon' => 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', 'label' => 'Payments & Billing'],
                ['icon' => 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', 'label' => 'Customer Records'],
                ['icon' => 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 'label' => 'Reports & Analytics'],
            ] as $feature)
                <div style="padding:1.25rem 1.5rem; border-radius:0.875rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:0.875rem;">
                    <div style="width:2rem; height:2rem; border-radius:0.5rem; background:rgba(99,102,241,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <svg width="16" height="16" fill="none" stroke="rgba(165,180,252,0.9)" stroke-width="1.75" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="{{ $feature['icon'] }}"/>
                        </svg>
                    </div>
                    <span style="color:rgba(203,213,225,0.85); font-size:0.85rem; font-weight:500;">{{ $feature['label'] }}</span>
                </div>
            @endforeach
        </div>
    </section>

    <footer style="position:relative; z-index:10; padding:1.5rem 2rem; border-top:1px solid rgba(255,255,255,0.05);">
        <div style="max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
            <p style="color:rgba(100,116,139,0.6); font-size:0.78rem; margin:0;">
                &copy; {{ date('Y') }} {{ config('app.developer') }}. All rights reserved.
            </p>
            <p style="color:rgba(100,116,139,0.5); font-size:0.75rem; margin:0; display:flex; align-items:center; gap:0.35rem;">
                <span style="color:rgba(100,116,139,0.35);">Designed &amp; built by</span>
                <span style="color:rgba(165,180,252,0.7); font-weight:500;">{{ config('app.developer') }}</span>
            </p>
        </div>
    </footer>

</body>
</html>
