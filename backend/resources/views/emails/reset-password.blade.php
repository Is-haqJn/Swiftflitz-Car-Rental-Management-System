@extends('emails.layout')

@php $appName = app(\App\Settings\GeneralSettings::class)->site_name ?: config('app.name'); @endphp

@section('title', 'Reset Your Password - ' . $appName)

@section('preheader', 'You requested a password reset for your ' . $appName . ' account.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Reset Your Password</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $user->name }}, we received a request to reset your password.
    </p>

    {{-- CTA Button --}}
    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $url }}"
            style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
            Reset Password
        </a>
    </div>

    {{-- Expiry Notice --}}
    <div
        style="background-color: #fefce8; border-left: 4px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 4px;">Link expires soon</p>
        <p style="font-size: 13px; color: #78350f; line-height: 1.5;">
            This reset link will expire in <strong>{{ $expireMinutes }} minutes</strong>. If you did not request a
            password reset, you can safely ignore this email - your password will not change.
        </p>
    </div>

    {{-- Fallback URL --}}
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 24px; line-height: 1.6;">
        If the button above doesn't work, paste this link into your browser:<br>
        <a href="{{ $url }}" style="color: #1d4ed8; word-break: break-all;">{{ $url }}</a>
    </p>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Need help? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}"
            style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
