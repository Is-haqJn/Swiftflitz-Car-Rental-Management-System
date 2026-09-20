@extends('emails.layout')

@section('title', 'Payment Confirmed - ' . $transaction->reference)

@section('preheader', 'Your payment of ' . ($currency_symbol ?? config('swiftflitz.currency_symbol', '₵')) . number_format((float) $transaction->amount, 2) . ' has been received.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #15803d; margin-bottom: 6px;">Payment Received</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 28px;">
        Hi {{ $customerName }}, your payment has been successfully confirmed. Thank you!
    </p>

    {{-- Amount highlight --}}
    <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 20px 24px; text-align: center; margin-bottom: 28px;">
        <p style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">Amount Paid</p>
        <p style="font-size: 32px; font-weight: 800; color: #15803d; margin: 0; letter-spacing: -0.02em;">
            {{ $currency_symbol ?? config('swiftflitz.currency_symbol', '₵') }} {{ number_format((float) $transaction->amount, 2) }}
        </p>
    </div>

    {{-- Payment Details --}}
    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #6b7280; margin-bottom: 10px;">Payment Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 28px;">
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 45%;">Reference</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #15803d; font-family: monospace;">{{ $transaction->reference }}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Payment Provider</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ ucfirst($transaction->provider ?? 'Online') }}</td>
        </tr>
        @if ($transaction->channel)
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Payment Channel</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">{{ match($transaction->channel) { 'momo' => 'Mobile Money', 'card' => 'Card', 'cash' => 'Cash', 'bank_transfer' => 'Bank Transfer', default => ucfirst($transaction->channel) } }}</td>
        </tr>
        @endif
        @if ($transaction->payment_phone)
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Payment Phone</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827; font-family: monospace;">{{ $transaction->payment_phone }}</td>
        </tr>
        @endif
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Date Paid</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">{{ ($transaction->paid_at ?? $transaction->created_at)?->format('D, d M Y g:i A') }}</td>
        </tr>
        @if ($transaction->payer_email)
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; font-size: 13px; color: #6b7280;">Email</td>
            <td style="padding: 10px 16px; font-size: 13px; color: #111827;">{{ $transaction->payer_email }}</td>
        </tr>
        @endif
    </table>

    {{-- Booking Details --}}
    @if ($bookingDetails)
    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #6b7280; margin-bottom: 10px;">{{ $bookingDetails['type'] }} Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 28px;">
        @if ($bookingDetails['reference'])
        <tr style="background-color: #eff6ff;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1e40af; width: 45%;">Booking Reference</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #1d4ed8; font-family: monospace;">{{ $bookingDetails['reference'] }}</td>
        </tr>
        @endif
        @foreach ($bookingDetails['rows'] as $rowLabel => $rowValue)
        <tr @if ($loop->odd) style="background-color: #f9fafb;" @endif>
            <td style="padding: 10px 16px; {{ !$loop->last ? 'border-bottom: 1px solid #e5e7eb;' : '' }} font-size: 13px; color: #6b7280;">{{ $rowLabel }}</td>
            <td style="padding: 10px 16px; {{ !$loop->last ? 'border-bottom: 1px solid #e5e7eb;' : '' }} font-size: 13px; font-weight: 600; color: #111827;">{{ $rowValue }}</td>
        </tr>
        @endforeach
    </table>
    @endif

    {{-- Payer details if not same as booking customer --}}
    @if ($transaction->payer_name || $transaction->payer_phone)
    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #6b7280; margin-bottom: 10px;">Payer Information</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 28px;">
        @if ($transaction->payer_name)
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; {{ $transaction->payer_phone ? 'border-bottom: 1px solid #e5e7eb;' : '' }} font-size: 13px; color: #6b7280; width: 45%;">Name</td>
            <td style="padding: 10px 16px; {{ $transaction->payer_phone ? 'border-bottom: 1px solid #e5e7eb;' : '' }} font-size: 13px; font-weight: 600; color: #111827;">{{ $transaction->payer_name }}</td>
        </tr>
        @endif
        @if ($transaction->payer_phone)
        <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #6b7280;">Phone</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #111827; font-family: monospace;">{{ $transaction->payer_phone }}</td>
        </tr>
        @endif
    </table>
    @endif

    @if ($transaction->transactable_type === 'rental')
    @if ($profileIncomplete)
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; line-height: 1.6;">
        <p style="font-size: 13px; color: #1e40af; margin: 0;">
            We have received your payment. However, your <strong>booking is currently pending</strong> and will only be confirmed once you complete your profile and your documents have been submitted for verification.
        </p>
    </div>
    <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="font-size: 14px; font-weight: 700; color: #b91c1c; margin: 0; text-align: center;">
            &#9888; Your booking is NOT confirmed until you complete your profile.
        </p>
    </div>
    @if ($profileCompleteUrl)
    <div style="text-align: center; margin-bottom: 28px;">
        <a href="{{ $profileCompleteUrl }}"
           style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none;
                  font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
            Complete Your Profile Now
        </a>
    </div>
    @endif
    @else
    <p style="font-size: 13px; color: #78350f; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; line-height: 1.5;">
        Please bring a valid driver's license and a government-issued ID on pickup day. Ensure your licence has not expired.
    </p>
    @endif
    @endif

    <p style="color: #6b7280; font-size: 13px; text-align: center; border-top: 1px solid #f0f2f5; padding-top: 20px; margin-bottom: 0;">
        Please keep your payment reference <strong style="color: #15803d;">{{ $transaction->reference }}</strong> for your records.
        If you have any questions about this payment, please contact our support team.
    </p>
@endsection
