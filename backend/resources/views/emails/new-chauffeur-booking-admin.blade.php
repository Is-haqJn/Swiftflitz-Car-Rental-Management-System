@extends('emails.layout')

@section('title', 'New Chauffeur Booking - ' . $booking->booking_reference)

@section('preheader', 'A new chauffeur booking ' . $booking->booking_reference . ' has been created.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #15803d; margin-bottom: 6px;">New Chauffeur Booking</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $recipient->name }}, a new chauffeur booking has been created.</p>

    {{-- Booking Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Booking Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #15803d;">{{ $booking->booking_reference }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Customer</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $booking->chauffeurCustomer?->full_name ?? 'N/A' }}</td>
        </tr>
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $booking->vehicle?->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Pickup Time</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ $booking->pickup_time?->format('D, M j, Y H:i') ?? 'N/A' }}</td>
        </tr>
        @if ($booking->pickup_location)
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Pickup Location</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ $booking->pickup_location }}</td>
        </tr>
        @endif
        @if ($booking->branch)
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Branch</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ $booking->branch->name }}</td>
        </tr>
        @endif
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Total Cost</td>
            <td style="padding: 12px 16px; font-size: 15px; font-weight: 700; color: #15803d;">{{ $currency_symbol ?? config('swiftflitz.currency_symbol', '₵') }}{{ number_format($booking->total_amount ?? 0, 2) }}</td>
        </tr>
    </table>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Log in to the admin panel to view and manage this booking.
    </p>
@endsection
