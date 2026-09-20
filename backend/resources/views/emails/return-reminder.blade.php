@extends('emails.layout')

@section('title', 'Return Reminder - ' . $rental->reference)

@section('preheader', 'Friendly reminder: your rental ' . $rental->reference . ' is due for return soon.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Return Reminder</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $rental->customer->name }}, your rental is due for return soon.</p>

    {{-- Urgency Banner --}}
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 13px; color: #c2410c; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Return Due</p>
        <p style="font-size: 24px; font-weight: 800; color: #ea580c;">{{ \Carbon\Carbon::parse($rental->return_date)->format('D, M j, Y') }}</p>
        @if ($rental->return_time)
            <p style="font-size: 14px; color: #c2410c; font-weight: 600; margin-top: 4px;">{{ \Carbon\Carbon::parse($rental->return_time)->format('g:i A') }}</p>
        @endif
    </div>

    {{-- Rental Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #1d4ed8;">{{ $rental->reference }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle->name ?? 'N/A' }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Licence Plate</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle->license_plate ?? 'N/A' }}</td>
        </tr>
    </table>

    {{-- Late Fee Warning --}}
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #991b1b; font-weight: 600; margin-bottom: 4px;">Avoid Late Fees</p>
        <p style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">Returning your vehicle after the due date may incur additional charges. Please return on time or contact us to extend your rental.</p>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Need to extend? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
