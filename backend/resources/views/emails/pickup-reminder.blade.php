@extends('emails.layout')

@section('title', 'Pickup Reminder - ' . $rental->reference)

@section('preheader', 'Rental ' . $rental->reference . ' is scheduled for pickup tomorrow - please ensure the vehicle is ready.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Pickup Scheduled Tomorrow</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">The following rental is due for pickup tomorrow. Please ensure the vehicle is prepared and ready for handover.</p>

    {{-- Pickup Date Banner --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 13px; color: #1d4ed8; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Pickup Date</p>
        <p style="font-size: 24px; font-weight: 800; color: #1e40af;">{{ \Carbon\Carbon::parse($rental->pickup_date)->format('D, M j, Y') }}</p>
        @if ($rental->pickup_time)
            <p style="font-size: 14px; color: #1d4ed8; font-weight: 600; margin-top: 4px;">{{ \Carbon\Carbon::parse($rental->pickup_time)->format('g:i A') }}</p>
        @endif
    </div>

    {{-- Rental Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #1d4ed8;">{{ $rental->reference }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Customer Name</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->customer->name ?? 'N/A' }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Vehicle Name</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">License Plate</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle->license_plate ?? 'N/A' }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Pickup Date</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #111827;">
                {{ \Carbon\Carbon::parse($rental->pickup_date)->format('D, M j, Y') }}
                @if ($rental->pickup_time)
                    <span style="color: #6b7280; font-weight: 400;"> &bull; {{ \Carbon\Carbon::parse($rental->pickup_time)->format('g:i A') }}</span>
                @endif
            </td>
        </tr>
    </table>

    {{-- Readiness Note --}}
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #15803d; font-weight: 600; margin-bottom: 4px;">Action Required</p>
        <p style="font-size: 13px; color: #166534; line-height: 1.5;">Please ensure the vehicle is cleaned, fuelled, and ready for pickup before the scheduled time. Conduct any required pre-rental inspections in advance.</p>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        For any queries, contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
