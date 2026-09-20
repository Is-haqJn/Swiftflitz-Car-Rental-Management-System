@extends('emails.layout')

@section('title', 'Chauffeur Pickup Reminder - ' . $booking->booking_reference)

@section('preheader', 'Reminder: Chauffeur booking ' . $booking->booking_reference . ' has a pickup scheduled for tomorrow.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Pickup Reminder</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $recipientName }}, this is a reminder that the following chauffeur booking has a pickup scheduled for tomorrow.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin: 0; letter-spacing: 1px;">{{ $booking->booking_reference }}</p>
    </div>

    {{-- Booking details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Booking Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Customer</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $booking->chauffeurCustomer?->full_name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Time</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $booking->pickup_time?->format('D, M j, Y H:i') ?? 'N/A' }}</td>
        </tr>
        @if ($booking->pickup_location)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $booking->pickup_location }}</td>
        </tr>
        @endif
        @if ($booking->vehicle)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $booking->vehicle->name }}</td>
        </tr>
        @endif
    </table>

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please ensure all arrangements are in place for this pickup.
    </p>
@endsection
