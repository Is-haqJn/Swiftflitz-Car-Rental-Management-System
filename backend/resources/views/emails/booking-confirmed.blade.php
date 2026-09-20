@extends('emails.layout')

@section('title', 'Booking Confirmed')

@section('preheader', 'Your rental booking is confirmed. Your receipt is attached.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Booking Confirmed!</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, great news - your rental booking is confirmed. Please review your booking details below.
    </p>

    {{-- PDF receipt notice --}}
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 16px;margin-bottom:24px;">
        <span style="font-size:13px;color:#166534;font-weight:600;">&#128206; Your booking receipt is attached to this email as a PDF.</span>
    </div>

    {{-- Reference badge --}}
    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #15803d; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Booking details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Booking Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $vehicleName }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Date</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">
                {{ $pickupDate }}@if ($pickupTime) at {{ $pickupTime }}@endif
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Return Date</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">
                {{ $returnDate }}@if ($returnTime) at {{ $returnTime }}@endif
            </td>
        </tr>
        @if ($pickupLocation)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $pickupLocation }}</td>
        </tr>
        @endif
        @if ($dropoffLocation)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Drop-off Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $dropoffLocation }}</td>
        </tr>
        @endif
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; border-top: 1px solid #e5e7eb;">Amount Charged</td>
            <td style="font-size: 14px; color: #111827; font-weight: 700; padding: 10px 0 4px; border-top: 1px solid #e5e7eb; text-align: right;">
                {{ $currency_symbol ?? '₵' }}{{ number_format($totalCost + $depositPaid, 2) }}
            </td>
        </tr>
    </table>

    {{-- What's next --}}
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
        <p style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px;">What happens next?</p>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.7; margin: 0;">
            Our team will be in touch shortly with any additional details or instructions before your pickup date.
        </p>
    </div>

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please keep your booking reference <strong style="color: #6b7280;">{{ $reference }}</strong> handy for your records.
    </p>
@endsection
