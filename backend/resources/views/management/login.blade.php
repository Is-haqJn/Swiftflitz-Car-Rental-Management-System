@extends('management.layout')

@section('title', 'Sign in')

@section('content')
<div class="min-h-screen flex">
    {{-- Left panel --}}
    <div class="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden"
        style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);">
        <div class="absolute inset-0"
            style="background: radial-gradient(circle at 20% 50%, rgba(99,102,241,0.35) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.25) 0%, transparent 45%);">
        </div>
        <div class="relative flex flex-col justify-between p-12 w-full" style="z-index:1;">
            <div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                        style="background:rgba(99,102,241,0.9);">
                        <svg class="w-5 h-5" style="color:#fff;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <span class="font-semibold text-lg" style="color:#fff;">{{ config('app.developer') }}</span>
                </div>
            </div>

            <div>
                <h2 class="text-3xl font-bold leading-tight" style="color:#fff;">
                    Operations<br>Console
                </h2>
                <p class="mt-3 text-sm leading-relaxed max-w-xs" style="color:rgba(199,210,254,0.8);">
                    Monitor system health, manage queues, and access advanced tooling from a single secure interface.
                </p>
                <div class="mt-8 grid grid-cols-2 gap-4">
                    <div class="rounded-xl p-4"
                        style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);">
                        <div class="text-xs uppercase tracking-wider" style="color:rgba(165,180,252,0.7);">Queue</div>
                        <div class="font-semibold mt-1" style="color:#fff;">Real-time monitoring</div>
                    </div>
                    <div class="rounded-xl p-4"
                        style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);">
                        <div class="text-xs uppercase tracking-wider" style="color:rgba(165,180,252,0.7);">Logs</div>
                        <div class="font-semibold mt-1" style="color:#fff;">Critical alerts</div>
                    </div>
                </div>
            </div>

            <div class="text-xs" style="color:rgba(165,180,252,0.35);">
                &copy; {{ date('Y') }} {{ config('app.developer') }}
            </div>
        </div>
    </div>

    {{-- Right panel --}}
    <div class="flex-1 flex items-center justify-center p-8" style="background:#f8fafc;">
        <div class="w-full max-w-sm">
            <div class="mb-8">
                <div class="lg:hidden flex items-center gap-2 mb-6">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                        style="background:#4f46e5;">
                        <svg class="w-4 h-4" style="color:#fff;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <span class="font-semibold" style="color:#1e293b;">{{ config('app.developer') }}</span>
                </div>
                <h1 class="text-2xl font-bold" style="color:#0f172a;">Welcome back</h1>
                <p class="text-sm mt-1" style="color:#64748b;">Sign in to continue.</p>
            </div>

            @if ($errors->any())
                <div class="mb-5 flex gap-3 p-3.5 rounded-xl"
                    style="background:#fff1f2; border:1px solid #fecdd3;">
                    <svg class="w-4 h-4 mt-0.5 shrink-0" style="color:#f43f5e;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-sm" style="color:#be123c;">{{ $errors->first() }}</p>
                </div>
            @endif

            <form method="POST" action="{{ route('management.login.submit') }}" class="space-y-4">
                @csrf

                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                        style="color:#475569;">Email</label>
                    <input type="email" name="email" value="{{ old('email') }}" required autofocus
                        placeholder="you@example.com"
                        style="width:100%; border-radius:0.75rem; border:1.5px solid #e2e8f0; background:#fff; padding:0.75rem 1rem; font-size:0.875rem; color:#0f172a; outline:none; box-shadow:0 1px 3px rgba(0,0,0,0.06); transition:border-color 0.15s, box-shadow 0.15s;"
                        onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)';"
                        onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';">
                </div>

                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                        style="color:#475569;">Password</label>
                    <input type="password" name="password" required
                        placeholder="Enter your password"
                        style="width:100%; border-radius:0.75rem; border:1.5px solid #e2e8f0; background:#fff; padding:0.75rem 1rem; font-size:0.875rem; color:#0f172a; outline:none; box-shadow:0 1px 3px rgba(0,0,0,0.06); transition:border-color 0.15s, box-shadow 0.15s;"
                        onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)';"
                        onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';">
                </div>

                <div class="flex items-center">
                    <label class="flex items-center gap-2.5 text-sm cursor-pointer" style="color:#475569;">
                        <input type="checkbox" name="remember"
                            class="w-4 h-4 rounded"
                            style="accent-color:#4f46e5;">
                        <span>Remember me</span>
                    </label>
                </div>

                <button type="submit"
                    style="width:100%; background:#4f46e5; color:#fff; font-weight:600; padding:0.8rem 1rem; border-radius:0.75rem; font-size:0.875rem; border:none; cursor:pointer; transition:background 0.15s; box-shadow:0 2px 8px rgba(79,70,229,0.3);"
                    onmouseover="this.style.background='#4338ca';"
                    onmouseout="this.style.background='#4f46e5';">
                    Sign in
                </button>
            </form>
        </div>
    </div>
</div>
@endsection
