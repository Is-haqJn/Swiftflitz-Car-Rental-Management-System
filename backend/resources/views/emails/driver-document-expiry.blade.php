@extends('emails.layout')

@section('title', 'Driver Document Expiry Alert')

@section('preheader', 'A driver document is expiring soon and requires attention.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Driver Document Expiry Alert</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $recipientName }}, the following driver document is expiring soon and requires your attention.
    </p>

    {{-- Alert banner --}}
    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; margin-bottom: 24px;">
        <span style="font-size: 13px; color: #92400e; font-weight: 600;">&#9888; Action required: Please renew the document before the expiry date.</span>
    </div>

    {{-- Document details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Document Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Driver</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $driverName }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Document Type</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $documentType }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Expiry Date</td>
            <td style="font-size: 14px; color: #dc2626; font-weight: 700; padding: 4px 0;">{{ $expiryDate }}</td>
        </tr>
    </table>

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please log in to the system to update the driver's document details.
    </p>
@endsection
