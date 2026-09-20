@extends('emails.layout')

@section('title', 'Rental Booking Cancelled')

@section('preheader', 'Your rental booking has been cancelled.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Rental Cancelled</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, your rental booking has been cancelled.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #dc2626; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #dc2626; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Rental details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Rental Details
            </td>
        </tr>
        @if ($vehicleName)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $vehicleName }}</td>
        </tr>
        @endif
    </table>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6; margin-bottom: 0;">
        If you have any questions about your cancellation, please don't hesitate to contact us.
    </p>
@endsection
