@extends('emails.layout')

@section('title', $variant === 'receipt' ? 'Booking Confirmed' : 'Booking Invoice')

@section('preheader', $variant === 'receipt'
    ? 'Your chauffeur booking is confirmed. Your receipt is attached.'
    : 'Your chauffeur booking invoice is attached.')

@section('content')
    @if ($recipient === 'driver')
        <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">New Chauffeur Assignment</h1>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
            Hi {{ $driverName ?? 'Driver' }}, you have been assigned to a chauffeur booking. Please find the booking details and {{ $variant }} attached.
        </p>
    @else
        <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">
            {{ $variant === 'receipt' ? 'Booking Confirmed!' : 'Booking Invoice' }}
        </h1>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
            Hi {{ $customerName }},
            @if ($variant === 'receipt')
                your chauffeur booking is confirmed. Please find your receipt attached.
            @else
                thank you for your chauffeur booking. Your invoice is attached - payment is due before or at the time of service.
            @endif
        </p>
    @endif

    {{-- PDF notice --}}
    <div style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 16px;margin-bottom:24px;">
        <span style="font-size:13px;color:#1d4ed8;font-weight:600;">&#128206; Your booking {{ $variant }} is attached to this email as a PDF.</span>
    </div>

    {{-- Reference badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Trip details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Trip Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $vehicleName }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $pickupTime }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Return</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $returnTime }}</td>
        </tr>
        @if ($pickupLocation)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $pickupLocation }}</td>
        </tr>
        @endif
        @if ($driverName && $recipient !== 'driver')
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Driver</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $driverName }}</td>
        </tr>
        @endif
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; border-top: 1px solid #e5e7eb;">Total</td>
            <td style="font-size: 14px; color: #111827; font-weight: 700; padding: 10px 0 4px; border-top: 1px solid #e5e7eb; text-align: right;">
                {{ $currency_symbol ?? '₵' }}{{ number_format($totalAmount, 2) }}
            </td>
        </tr>
    </table>

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please keep your booking reference <strong style="color: #6b7280;">{{ $reference }}</strong> handy.
    </p>
@endsection
