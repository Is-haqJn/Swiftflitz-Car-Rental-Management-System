@extends('emails.layout')

@section('title', 'Complete Your Payment - ' . $reference)

@section('preheader', 'You have an outstanding balance of ' . ($currency_symbol ?? config('swiftflitz.currency_symbol', '₵')) . number_format($amountDue, 2) . ' for booking ' . $reference . '.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Payment Required</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $customerName }}, you have an outstanding balance on your {{ strtolower($bookingType ?? 'rental') }} booking.</p>

    {{-- Reference Badge --}}
    <div
        style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p
            style="font-size: 12px; color: #3b82f6; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
            Booking Reference</p>
        <p style="font-size: 28px; font-weight: 800; color: #1d4ed8; letter-spacing: 2px;">{{ $reference }}</p>
    </div>

    {{-- Amount Due --}}
    <div
        style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 13px; color: #c2410c; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
            Amount Due</p>
        <p style="font-size: 36px; font-weight: 800; color: #ea580c; margin-bottom: 0;">
            {{ $currency_symbol ?? config('swiftflitz.currency_symbol', '₵') }}{{ number_format($amountDue, 2) }}
        </p>
    </div>

    {{-- CTA Button --}}
    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $paymentUrl }}"
            style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 16px; font-weight: 700; padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
            Pay Now
        </a>
    </div>

    {{-- Security note --}}
    <div
        style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #166534; line-height: 1.5;">Your payment is processed securely. If you did not request this link, please ignore this email or contact our support team.</p>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Questions? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}"
            style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
