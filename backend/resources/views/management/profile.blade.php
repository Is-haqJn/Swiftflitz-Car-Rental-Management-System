@extends('management.layout')

@section('title', 'Profile')
@section('heading', 'Profile')

@section('content')
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {{-- Avatar --}}
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Profile Photo</h2>
        <div class="flex flex-col items-center text-center">
            @if ($user->profile_photo_path)
                <img src="{{ asset('storage/' . $user->profile_photo_path) }}" alt="avatar"
                    class="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow">
            @else
                <div class="w-32 h-32 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-4xl">
                    {{ strtoupper(substr($user->name, 0, 1)) }}
                </div>
            @endif

            <form method="POST" action="{{ route('management.profile.avatar.upload') }}" enctype="multipart/form-data" class="mt-4 w-full space-y-2">
                @csrf
                <input type="file" name="avatar" accept="image/*" required
                    class="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                <button type="submit" class="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
                    Upload
                </button>
            </form>

            @if ($user->profile_photo_path)
                <form method="POST" action="{{ route('management.profile.avatar.delete') }}" class="mt-2 w-full">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="w-full px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-medium">
                        Remove Photo
                    </button>
                </form>
            @endif
        </div>
    </div>

    {{-- Profile info --}}
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Account Details</h2>
        <form method="POST" action="{{ route('management.profile.update') }}" class="space-y-4">
            @csrf
            @method('PUT')

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" name="name" value="{{ old('name', $user->name) }}" required
                    placeholder="Your full name"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" name="email" value="{{ old('email', $user->email) }}" required
                    placeholder="you@example.com"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="text" name="phone" value="{{ old('phone', $user->phone) }}"
                    placeholder="+233 xx xxx xxxx"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div class="pt-2">
                <button type="submit" class="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                    Save Changes
                </button>
            </div>
        </form>
    </div>

    {{-- Password --}}
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-3">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Change Password</h2>
        <form method="POST" action="{{ route('management.profile.password') }}" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @csrf
            @method('PUT')

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input type="password" name="current_password" required
                    placeholder="Enter current password"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" name="password" required
                    placeholder="Min. 8 characters"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
                <input type="password" name="password_confirmation" required
                    placeholder="Repeat new password"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div class="md:col-span-3">
                <button type="submit" class="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                    Update Password
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
