@extends('emails.layout')

@section('title', 'Refund Processed')

@section('preheader', 'Your refund has been processed for booking ' . $reference . '.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Refund Processed</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, we're writing to confirm that a refund has been processed for your chauffeur booking.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    {{-- Booking dates --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Booking Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 50%;">Pickup</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $pickupTime ?? '-' }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Return</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $returnTime ?? '-' }}</td>
        </tr>
    </table>

    {{-- Refund breakdown --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Refund Summary
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 50%;">Amount Paid</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px; text-align: right;">{{ $currency_symbol ?? '₵' }} {{ number_format($amountPaid, 2) }}</td>
        </tr>
        @if ($cancellationFee > 0)
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Cancellation Fee</td>
            <td style="font-size: 13px; color: #dc2626; font-weight: 600; padding: 4px 0; text-align: right;">− {{ $currency_symbol ?? '₵' }} {{ number_format($cancellationFee, 2) }}</td>
        </tr>
        @endif
        <tr>
            <td style="font-size: 14px; color: #111827; font-weight: 700; padding: 12px 0 4px; border-top: 2px solid #e5e7eb;">Amount Refunded</td>
            <td style="font-size: 16px; color: #059669; font-weight: 700; padding: 12px 0 4px; border-top: 2px solid #e5e7eb; text-align: right;">{{ $currency_symbol ?? '₵' }} {{ number_format($netRefund, 2) }}</td>
        </tr>
    </table>

    @if ($refundNote)
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
        <p style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">Note</p>
        <p style="font-size: 13px; color: #374151; margin: 0;">{{ $refundNote }}</p>
    </div>
    @endif

    <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 0;">
        Please allow <strong>3–5 business days</strong> for the refund to reflect in your account.
        If you have any questions, please contact us quoting your booking reference
        <strong style="color: #374151;">{{ $reference }}</strong>.
    </p>
@endsection
