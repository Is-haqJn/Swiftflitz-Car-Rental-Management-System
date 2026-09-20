@extends('emails.layout')

@section('title', 'New Booking - ' . $rental->reference)

@section('preheader', 'A new booking ' . $rental->reference . ' has been created for ' . ($rental->customer?->name ?? 'a customer') . '.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #15803d; margin-bottom: 6px;">New Booking Created</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $admin->name }}, a new booking has been created and assigned.</p>

    {{-- Booking Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Booking Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #15803d;">{{ $rental->reference }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Customer</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->customer?->name ?? 'N/A' }}</td>
        </tr>
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle?->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Pickup Date</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">
                {{ $rental->pickup_date?->format('D, M j, Y') ?? 'N/A' }}
                @if ($rental->pickup_time)
                    &nbsp;at&nbsp;{{ \Carbon\Carbon::parse($rental->pickup_time)->format('g:i A') }}
                @endif
            </td>
        </tr>
        <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Return Date</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">
                {{ $rental->return_date?->format('D, M j, Y') ?? 'N/A' }}
                @if ($rental->return_time)
                    &nbsp;at&nbsp;{{ \Carbon\Carbon::parse($rental->return_time)->format('g:i A') }}
                @endif
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Total Cost</td>
            <td style="padding: 12px 16px; font-size: 15px; font-weight: 700; color: #15803d;">{{ $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵') }}{{ number_format($rental->total_cost ?? 0, 2) }}</td>
        </tr>
    </table>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Log in to the admin panel to view and manage this booking.
    </p>
@endsection
