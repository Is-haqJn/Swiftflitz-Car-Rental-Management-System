@extends('emails.layout')

@section('title', 'Complete Your Profile')

@section('preheader', 'Your booking is confirmed - please complete your profile to finalise your rental.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Almost there, {{ $customerName }}!</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Your rental booking has been received. To finalise your reservation, we need a few more details from you.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #15803d; margin: 0; letter-spacing: 1px;">{{ $rentalReference }}</p>
    </div>

    {{-- What you need to provide --}}
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
        <p style="font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 8px;">&#128203; You'll need to provide:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #78350f; line-height: 2;">
            <li>Home address</li>
            <li>Driver's license number &amp; expiry date</li>
            <li>Driver's license image</li>
            <li>Valid ID document (photo)</li>
        </ul>
    </div>

    {{-- CTA button --}}
    <div style="text-align: center; margin-bottom: 28px;">
        <a href="{{ $completionUrl }}"
           style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
            Complete My Profile &rarr;
        </a>
    </div>

    {{-- Expiry note --}}
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 24px;">
        This link expires on {{ $expiresAt->format('D, d M Y \a\t g:i A') }}. Please complete your profile before then.
    </p>

    {{-- Fallback link --}}
    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #6b7280; word-break: break-all;">{{ $completionUrl }}</span>
    </p>
@endsection
