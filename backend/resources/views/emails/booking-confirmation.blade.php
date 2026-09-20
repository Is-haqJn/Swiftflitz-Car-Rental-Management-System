@extends('emails.layout')

@section('title', $paymentUrl ? 'Booking Received - Payment Required - ' . $rental->reference : 'Booking Confirmation - ' . $rental->reference)

@section('preheader', $paymentUrl ? 'Your booking ' . $rental->reference . ' has been received. Complete payment to confirm.' : 'Your booking ' . $rental->reference . ' has been confirmed. Here are your details.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">
        {{ $paymentUrl ? 'Booking Received' : 'Booking Confirmed' }}
    </h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $rental->customer->name }},
        {{ $paymentUrl
            ? 'your booking has been received. Complete payment to confirm your reservation.'
            : 'your booking is confirmed.' }}
    </p>

    {{-- Reference Badge --}}
    <div
        style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p
            style="font-size: 12px; color: #3b82f6; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
            Booking Reference</p>
        <p style="font-size: 28px; font-weight: 800; color: #1d4ed8; letter-spacing: 2px;">{{ $rental->reference }}</p>
    </div>

    {{-- Booking Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
        <tr>
            <td style="padding-bottom: 16px;">
                <p
                    style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                    Booking Details</p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <tr style="background-color: #f9fafb;">
                        <td
                            style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">
                            Vehicle</td>
                        <td
                            style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                            {{ $rental->vehicle->name ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                            Pickup Date</td>
                        <td
                            style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                            {{ \Carbon\Carbon::parse($rental->pickup_date)->format('D, M j, Y') }}{{ $rental->pickup_time ? ' at ' . \Carbon\Carbon::parse($rental->pickup_time)->format('H:i') : '' }}</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                            Return Date</td>
                        <td
                            style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                            {{ \Carbon\Carbon::parse($rental->return_date)->format('D, M j, Y') }}{{ $rental->return_time ? ' at ' . \Carbon\Carbon::parse($rental->return_time)->format('H:i') : '' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                            Duration</td>
                        <td
                            style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                            {{ \Carbon\Carbon::parse($rental->pickup_date)->diffInDays($rental->return_date) }} days</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                        <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Total Cost</td>
                        <td style="padding: 12px 16px; font-size: 15px; font-weight: 700; color: #1d4ed8;">
                            {{ $currencySymbol }}{{ number_format($rental->total_cost, 2) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @if($paymentUrl)
        {{-- Amount Due --}}
        @if($amountDue !== null)
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 12px; color: #9a3412; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Amount Due</p>
            <p style="font-size: 26px; font-weight: 800; color: #c2410c;">{{ $currencySymbol }}{{ number_format($amountDue, 2) }}</p>
        </div>
        @endif

        {{-- Payment Required info box --}}
        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #9a3412; font-weight: 600; margin-bottom: 4px;">Payment Required</p>
            <p style="font-size: 13px; color: #7c2d12; line-height: 1.5;">Your booking is reserved but not confirmed until payment is received. Click the button below to complete your payment securely.</p>
        </div>

        {{-- Pay Now button --}}
        <div style="text-align: center; margin-bottom: 16px;">
            <a href="{{ $paymentUrl }}"
                style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
                Complete Payment
            </a>
        </div>

        {{-- Copy link fallback --}}
        <div style="background-color: #f8faff; border: 1px dashed #bfdbfe; border-radius: 6px; padding: 12px 16px; margin-bottom: 32px; text-align: center;">
            <p style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">Button not working? Copy and paste this link into your browser:</p>
            <a href="{{ $paymentUrl }}" style="font-size: 11px; color: #1d4ed8; word-break: break-all; text-decoration: underline;">{{ $paymentUrl }}</a>
        </div>

        {{-- Pickup docs disclaimer --}}
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
            <p style="font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 4px;">Important</p>
            <p style="font-size: 13px; color: #78350f; line-height: 1.5;">Payment alone does not entitle you to collect the vehicle. You must present your valid driver's license and required ID documents at pickup.</p>
        </div>
    @else
        {{-- Confirmed: Important Notice --}}
        <div
            style="background-color: #fefce8; border-left: 4px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
            <p style="font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 4px;">Important</p>
            <p style="font-size: 13px; color: #78350f; line-height: 1.5;">Please bring a valid ID and your driver's licence on
                pickup day. Ensure your licence has not expired.</p>
        </div>
    @endif

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Questions? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}"
            style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
