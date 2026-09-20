@extends('emails.layout')

@section('title', 'Overdue Rental Alert - ' . $rental->reference)

@section('preheader', 'Action required: your rental ' . $rental->reference . ' is overdue. Please return the vehicle immediately.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #991b1b; margin-bottom: 6px;">Overdue Rental Alert</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $rental->customer->name }}, your rental has passed its scheduled return date.</p>

    {{-- Overdue Banner --}}
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Overdue Since</p>
        <p style="font-size: 26px; font-weight: 800; color: #b91c1c;">{{ \Carbon\Carbon::parse($rental->return_date)->format('D, M j, Y') }}</p>
        @if ($rental->return_time)
            <p style="font-size: 14px; color: #dc2626; font-weight: 600; margin-top: 4px;">{{ \Carbon\Carbon::parse($rental->return_time)->format('g:i A') }}</p>
        @endif
    </div>

    {{-- Rental Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #fecaca; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #fff5f5;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-size: 13px; color: #6b7280; width: 40%;">Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-size: 13px; font-weight: 700; color: #dc2626;">{{ $rental->reference }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-size: 13px; color: #6b7280;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-size: 13px; font-weight: 600; color: #111827;">{{ $rental->vehicle->name ?? 'N/A' }} ({{ $rental->vehicle->license_plate ?? 'N/A' }})</td>
        </tr>
        <tr style="background-color: #fff5f5;">
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Total Outstanding</td>
            <td style="padding: 12px 16px; font-size: 15px; font-weight: 700; color: #b91c1c;">{{ $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵') }}{{ number_format($rental->total_cost, 2) }}</td>
        </tr>
    </table>

    {{-- Immediate Action Required --}}
    <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <p style="font-size: 14px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">Immediate Action Required</p>
        <p style="font-size: 13px; color: #7f1d1d; line-height: 1.6;">
            Please return the vehicle immediately. Continued delay will result in additional daily charges and may lead to escalated recovery action.
            Contact us urgently to arrange the return.
        </p>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Contact us immediately at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #dc2626; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
        or call <strong>{{ config('app.support_phone', '') }}</strong>
    </p>
@endsection
