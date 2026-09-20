@extends('emails.layout')

@section('title', 'Confirm Your Rental Booking')

@section('preheader', 'Someone is completing a rental booking using your account. Click to confirm it\'s you.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Confirm Your Booking</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $customerName }}, someone is completing a rental booking using your account.
        If this is you, click the button below to confirm your identity and continue your booking.
    </p>

    {{-- CTA Button --}}
    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $verifyUrl }}"
           style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 15px; font-weight: 700;
                  padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
            &#10003; Yes, this is me - Confirm
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
            Or paste this link into your browser:<br>
            <a href="{{ $verifyUrl }}" style="color: #1d4ed8; word-break: break-all; font-size: 11px;">{{ $verifyUrl }}</a>
        </p>
    </div>

    {{-- Expiry notice --}}
    @if ($expiresAt)
    <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #78350f; line-height: 1.6; margin: 0;">
            &#9888; This link expires on <strong>{{ $expiresAt->format('D, M j, Y \a\t g:i A') }}</strong>.
        </p>
    </div>
    @endif

    {{-- Safety notice --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6; margin-bottom: 0;">
        If you didn't request this, ignore this email. Nothing will happen and your account remains secure.
    </p>
@endsection
