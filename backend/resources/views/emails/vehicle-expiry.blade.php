@extends('emails.layout')

@section('title', 'Document Expiry - ' . $vehicle->name . ' (' . $vehicle->license_plate . ')')

@section('preheader', 'Action required: a vehicle document for ' . $vehicle->name . ' (' . $vehicle->license_plate . ') is expiring soon.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Document Expiry Alert</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">One or more vehicle documents require urgent attention. Please review the details below and take action as soon as possible.</p>

    {{-- Warning Banner --}}
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #92400e; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px;">Expiry Notice</p>
        <p style="font-size: 14px; color: #78350f; line-height: 1.6;">{{ $notice }}</p>
    </div>

    {{-- Vehicle Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Vehicle Name</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #111827;">{{ $vehicle->name }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">License Plate</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $vehicle->license_plate }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Make</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $vehicle->make }}</td>
        </tr>
        <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Model</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #111827;">{{ $vehicle->model }}</td>
        </tr>
    </table>

    {{-- Urgency Note --}}
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #991b1b; font-weight: 600; margin-bottom: 4px;">Urgent Action Required</p>
        <p style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">Please arrange renewal of the expiring documents immediately to avoid compliance issues and ensure this vehicle remains operational.</p>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        For assistance, contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
