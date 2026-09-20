@extends('emails.layout')

@section('title', $rental->payment_status?->value === 'paid' ? 'Your Rental Receipt' : 'Your Rental Invoice')

@section('preheader', 'Please find your rental invoice/receipt attached for rental ' . $rental->reference . '.')

@section('content')
    @php
        $isPaid = $rental->payment_status?->value === 'paid';
        $docType = $isPaid ? 'Receipt' : 'Invoice';
        $customerName = $rental->customer?->name ?? 'there';
        $vehicleName = $rental->vehicle?->name ?? 'your selected vehicle';
        $symbol = $rental->currency_symbol ?? '₵';
        $amountDue = max(0, (float) ($rental->amount_due ?? 0));
    @endphp

    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">
        Your Rental {{ $docType }}
    </h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, please find your rental {{ strtolower($docType) }} attached to this email as a PDF.
    </p>

    {{-- PDF notice --}}
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 16px;margin-bottom:24px;">
        <span style="font-size:13px;color:#1e40af;font-weight:600;">&#128206; Your {{ strtolower($docType) }} is attached to this email as a PDF.</span>
    </div>

    {{-- Reference badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Rental Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin: 0; letter-spacing: 1px;">{{ $rental->reference }}</p>
    </div>

    {{-- Optional staff note --}}
    @if ($note ?? null)
    <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Note from our team</p>
        <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.6;">{{ $note }}</p>
    </div>
    @endif

    {{-- Booking summary --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Rental Summary
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 40%;">Customer</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $customerName }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Vehicle</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $vehicleName }}</td>
        </tr>
        @if ($rental->pickup_date)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Date</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">
                {{ \Carbon\Carbon::parse($rental->pickup_date)->format('D, M j, Y') }}
                @if ($rental->pickup_time) at {{ $rental->pickup_time }}@endif
            </td>
        </tr>
        @endif
        @if ($rental->return_date)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Return Date</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">
                {{ \Carbon\Carbon::parse($rental->return_date)->format('D, M j, Y') }}
                @if ($rental->return_time) at {{ $rental->return_time }}@endif
            </td>
        </tr>
        @endif
        @if ($rental->pickupLocation?->name)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Pickup Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $rental->pickupLocation->name }}</td>
        </tr>
        @endif
        @if ($rental->dropoffLocation?->name)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Drop-off Location</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $rental->dropoffLocation->name }}</td>
        </tr>
        @endif
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; border-top: 1px solid #e5e7eb;">Total Amount</td>
            <td style="font-size: 14px; color: #111827; font-weight: 700; padding: 10px 0 4px; border-top: 1px solid #e5e7eb; text-align: right;">
                {{ $symbol }}{{ number_format((float) $rental->total_cost, 2) }}
            </td>
        </tr>
        @if ($isPaid)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Status</td>
            <td style="font-size: 13px; padding: 4px 0; text-align: right;">
                <span style="background-color: #dcfce7; color: #166534; font-weight: 700; font-size: 11px; padding: 2px 10px; border-radius: 12px; letter-spacing: 0.5px;">PAID IN FULL</span>
            </td>
        </tr>
        @elseif ($amountDue > 0)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Balance Due</td>
            <td style="font-size: 14px; color: #dc2626; font-weight: 700; padding: 4px 0; text-align: right;">{{ $symbol }}{{ number_format($amountDue, 2) }}</td>
        </tr>
        @endif
    </table>

    {{-- Paid confirmation --}}
    @if ($isPaid)
    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 14px; font-weight: 700; color: #15803d; margin: 0;">Thank you - payment received in full!</p>
        <p style="font-size: 13px; color: #166534; margin-top: 6px; margin-bottom: 0;">We appreciate your business. Please keep this receipt for your records.</p>
    </div>
    @else
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
        <p style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px;">Payment required</p>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.7; margin: 0;">
            Please contact us or use the payment link provided by our team to settle your balance at the earliest convenience.
        </p>
    </div>
    @endif

    <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6; margin-bottom: 0;">
        Please keep your rental reference <strong style="color: #6b7280;">{{ $rental->reference }}</strong> handy for your records.
    </p>
@endsection
