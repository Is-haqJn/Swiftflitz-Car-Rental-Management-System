@extends('emails.layout')

@section('title', 'New Chauffeur Assignment')

@section('preheader', 'You have been assigned to a new chauffeur booking.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">New Assignment</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        You have been assigned to a chauffeur booking. Please review the details below and be ready at the scheduled pickup time.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Customer details --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Customer
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Name</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $customerName }}</td>
        </tr>
        @if ($customerPhone)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Phone</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $customerPhone }}</td>
        </tr>
        @endif
        @if ($customerEmail)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Email</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $customerEmail }}</td>
        </tr>
        @endif
    </table>

    {{-- Schedule --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Schedule
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Pickup</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $pickupTime }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Expected Return</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $returnTime }}</td>
        </tr>
        @if ($pickupLocation)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $pickupLocation }}</td>
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
        Please contact the office if you have any questions about this booking.
    </p>
@endsection
