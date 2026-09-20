@extends('emails.layout')

@section('title', 'Airport Transfer Booking Confirmed')

@section('preheader', 'Your airport transfer booking has been received and is being processed.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Booking Confirmed!</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, your airport transfer booking has been received. We'll notify you once it's confirmed.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #7c3aed; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Transfer details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Transfer Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Scheduled</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $scheduledAt }}</td>
        </tr>
        @if ($direction)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Direction</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $direction }}</td>
        </tr>
        @endif
        @if ($vehicleName)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $vehicleName }}</td>
        </tr>
        @endif
    </table>

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please keep your booking reference <strong style="color: #6b7280;">{{ $reference }}</strong> handy.
    </p>
@endsection
