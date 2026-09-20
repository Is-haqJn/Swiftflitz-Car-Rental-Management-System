@extends('emails.layout')

@section('title', 'Quote Request Received - ' . $quoteRequest->reference)

@section('preheader', 'We have received your quote request ' . $quoteRequest->reference . '. Our team will review and respond shortly.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Quote Request Received</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $quoteRequest->customer_name ?? $quoteRequest->customer?->name ?? 'there' }}, we've received your quote request and our team will review it shortly.</p>

    {{-- Reference Badge --}}
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 12px; color: #15803d; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Quote Reference</p>
        <p style="font-size: 28px; font-weight: 800; color: #16a34a; letter-spacing: 2px;">{{ $quoteRequest->reference }}</p>
    </div>

    {{-- Request Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        @if ($quoteRequest->vehicle_category)
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Vehicle Category</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $quoteRequest->vehicle_category }}</td>
        </tr>
        @endif
        @if ($quoteRequest->pickup_date)
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Requested Pickup</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ \Carbon\Carbon::parse($quoteRequest->pickup_date)->format('D, M j, Y') }}</td>
        </tr>
        @endif
        @if ($quoteRequest->return_date)
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Requested Return</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ \Carbon\Carbon::parse($quoteRequest->return_date)->format('D, M j, Y') }}</td>
        </tr>
        @endif
        <tr @if ($quoteRequest->return_date) style="background-color: #f9fafb;" @endif>
            <td class="mobile-full-width" style="padding: 12px 16px; font-size: 13px; color: #6b7280; width: 40%;">Status</td>
            <td style="padding: 12px 16px;">
                <span style="display: inline-block; background-color: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px;">Pending Review</span>
            </td>
        </tr>
    </table>

    {{-- What Happens Next --}}
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #15803d; font-weight: 600; margin-bottom: 8px;">What happens next?</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="font-size: 13px; color: #166534; padding: 4px 0; padding-left: 16px; position: relative;">&#x2714;&nbsp; Our team will review your request</li>
            <li style="font-size: 13px; color: #166534; padding: 4px 0; padding-left: 16px;">&#x2714;&nbsp; You'll receive a personalised quote within 24 hours</li>
            <li style="font-size: 13px; color: #166534; padding: 4px 0; padding-left: 16px;">&#x2714;&nbsp; Confirm to convert to a full booking</li>
        </ul>
    </div>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Questions? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
