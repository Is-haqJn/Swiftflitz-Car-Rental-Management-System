@extends('emails.layout')

@section('title', 'New Quote Request - ' . $quoteRequest->reference)

@section('preheader', 'A new quote request has been submitted by ' . ($quoteRequest->name ?? 'a customer') . '.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin-bottom: 6px;">New Quote Request</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hi {{ $admin->name }}, a new quote request has been submitted and requires your attention.</p>

    {{-- Request Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Reference</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #1d4ed8;">{{ $quoteRequest->reference }}</td>
        </tr>
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Customer</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $quoteRequest->name }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Email</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ $quoteRequest->email }}</td>
        </tr>
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Phone</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ $quoteRequest->phone }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ $quoteRequest->vehicle?->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; font-size: 13px; color: #6b7280; width: 40%;">Rental Days</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #111827;">{{ $quoteRequest->rental_days }} day{{ $quoteRequest->rental_days !== 1 ? 's' : '' }}</td>
        </tr>
    </table>

    @if ($quoteRequest->message)
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
        <p style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Customer Message</p>
        <p style="font-size: 13px; color: #0c4a6e; line-height: 1.6; margin: 0;">{{ $quoteRequest->message }}</p>
    </div>
    @endif

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Log in to the admin panel to review and respond to this quote request.
    </p>
@endsection
