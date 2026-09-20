@extends('emails.layout')

@section('title', 'Complete Your Profile to Confirm Your Booking')

@section('preheader', 'Please complete your profile so we can confirm your rental booking.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Complete Your Profile</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $customer->name ?? 'there' }}, your rental booking has been created. To confirm it, we need you to complete your profile by providing your identity documents and a few personal details.
    </p>

    <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="font-size: 14px; font-weight: 700; color: #b91c1c; margin: 0; text-align: center;">
            &#9888; Your booking is NOT confirmed until your profile is complete.
        </p>
    </div>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #1e40af; margin: 0;">
            Please upload your <strong>driver's license</strong> and <strong>ID document</strong> using the secure link below.
            This link expires in <strong>48 hours</strong>.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $profileUrl }}"
           style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none;
                  font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
            Complete My Profile
        </a>
    </div>

    <p style="color: #6b7280; font-size: 13px; text-align: center;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #1d4ed8; word-break: break-all;">{{ $profileUrl }}</span>
    </p>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not make this booking, please contact us immediately.
    </p>
@endsection
