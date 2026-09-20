@extends('emails.layout')

@section('title', 'Booking Status Updated - ' . $reference)

@section('preheader', 'Your rental booking ' . $reference . ' status has been updated to ' . $newStatus . '.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin-bottom: 6px;">Booking Status Updated</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 28px;">
        Hi {{ $customerName }}, your rental booking status has been updated.
    </p>

    {{-- Status change banner --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 12px;">Status Update</p>
        <div style="display: inline-flex; align-items: center; gap: 12px;">
            <span style="font-size: 14px; color: #6b7280; font-weight: 600; background-color: #f3f4f6; padding: 4px 12px; border-radius: 999px;">{{ $oldStatus }}</span>
            <span style="font-size: 16px; color: #9ca3af;">&rarr;</span>
            <span style="font-size: 14px; color: #15803d; font-weight: 700; background-color: #f0fdf4; padding: 4px 12px; border-radius: 999px;">{{ $newStatus }}</span>
        </div>
    </div>

    {{-- Booking details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Booking Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Reference</td>
            <td style="font-size: 13px; color: #111827; font-weight: 700; padding: 10px 0 4px; letter-spacing: 0.5px;">{{ $reference }}</td>
        </tr>
        @if ($vehicleName)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $vehicleName }}</td>
        </tr>
        @endif
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">New Status</td>
            <td style="font-size: 13px; color: #15803d; font-weight: 700; padding: 4px 0;">{{ $newStatus }}</td>
        </tr>
    </table>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6; margin-bottom: 0;">
        If you have any questions about your booking, please contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
