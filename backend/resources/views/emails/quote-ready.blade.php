@extends('emails.layout')

@section('title', 'Your Quote is Ready - ' . $quoteRequest->reference)

@section('preheader', 'Your personalised vehicle rental quote is ready. Click the link inside to review and confirm your booking.')

@section('content')
    {{-- Greeting --}}
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Your Quote is Ready!</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $quoteRequest->name ?? 'there' }}, we've prepared a personalised quote for your vehicle rental.
        Please review the details below and confirm your booking using the button below.
    </p>

    {{-- Reference Badge --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; text-align: center;">
        <p style="font-size: 12px; color: #1d4ed8; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Quote Reference</p>
        <p style="font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: 2px;">{{ $quoteRequest->reference }}</p>
    </div>

    {{-- Quote Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        @if ($quoteRequest->vehicle)
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Vehicle</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $quoteRequest->vehicle->name ?? $quoteRequest->vehicle->make . ' ' . $quoteRequest->vehicle->model }}
                ({{ $quoteRequest->vehicle->year ?? '' }})
            </td>
        </tr>
        @endif
        @if ($quoteRequest->pickup_date)
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Pickup Date</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $quoteRequest->pickup_date->format('D, M j, Y') }}
            </td>
        </tr>
        @endif
        @if ($quoteRequest->return_date)
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Return Date</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $quoteRequest->return_date->format('D, M j, Y') }}
            </td>
        </tr>
        @endif
        @if ($quoteRequest->rental_days)
        <tr>
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Duration</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $quoteRequest->rental_days }} {{ Str::plural('day', $quoteRequest->rental_days) }}
            </td>
        </tr>
        @endif
        @if ($quoteRequest->pickupLocation)
        <tr style="background-color: #f9fafb;">
            <td class="mobile-full-width" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 40%;">Pickup Location</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $quoteRequest->pickupLocation->name }}
            </td>
        </tr>
        @endif
        <tr @if ($quoteRequest->pickupLocation) style="background-color: #ffffff;" @else style="background-color: #f9fafb;" @endif>
            <td class="mobile-full-width" style="padding: 12px 16px; font-size: 13px; color: #6b7280; width: 40%;">Link Expires</td>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #b45309;">
                {{ $expiresAt ? $expiresAt->format('D, M j, Y \a\t g:i A') : 'N/A' }}
            </td>
        </tr>
    </table>

    {{-- Pricing breakdown --}}
    @if ($pricing !== null)
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        {{-- Header --}}
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; font-weight: 600;" colspan="2">
                Pricing Breakdown
            </td>
        </tr>

        {{-- Line items: base, addons, location --}}
        @foreach ($pricing->breakdown as $i => $item)
            @if (in_array($item['type'], ['base', 'addon', 'location']))
            <tr @if ($i % 2 === 0) style="background-color: #ffffff;" @else style="background-color: #f9fafb;" @endif>
                <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">
                    {{ $item['label'] }}
                </td>
                <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827; text-align: right; white-space: nowrap;">
                    {{ $currency_symbol ?? '₵' }} {{ number_format($item['amount'], 2) }}
                </td>
            </tr>
            @endif
        @endforeach

        {{-- Subtotal --}}
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #374151;">Subtotal</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827; text-align: right; white-space: nowrap;">
                {{ $currency_symbol ?? '₵' }} {{ number_format($pricing->subtotal, 2) }}
            </td>
        </tr>

        {{-- Discounts --}}
        @if ($pricing->totalDiscountAmount > 0)
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #16a34a;">Discount</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #16a34a; text-align: right; white-space: nowrap;">
                −{{ $currency_symbol ?? '₵' }} {{ number_format($pricing->totalDiscountAmount, 2) }}
            </td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #374151;">After Discount</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827; text-align: right; white-space: nowrap;">
                {{ $currency_symbol ?? '₵' }} {{ number_format($pricing->discountedSubtotal, 2) }}
            </td>
        </tr>
        @endif

        {{-- VAT --}}
        @if ($pricing->taxAmount > 0)
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">VAT</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827; text-align: right; white-space: nowrap;">
                {{ $currency_symbol ?? '₵' }} {{ number_format($pricing->taxAmount, 2) }}
            </td>
        </tr>
        @endif

        {{-- Total --}}
        <tr style="background-color: #eff6ff;">
            <td style="padding: 12px 16px; {{ $pricing->depositAmount > 0 ? 'border-bottom: 1px solid #bfdbfe;' : '' }} font-size: 14px; font-weight: 700; color: #111827;">Total</td>
            <td style="padding: 12px 16px; {{ $pricing->depositAmount > 0 ? 'border-bottom: 1px solid #bfdbfe;' : '' }} font-size: 14px; font-weight: 800; color: #1d4ed8; text-align: right; white-space: nowrap;">
                {{ $currency_symbol ?? '₵' }} {{ number_format($pricing->totalAmount, 2) }}
            </td>
        </tr>

        {{-- Security Deposit --}}
        @if ($pricing->depositAmount > 0)
        <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 16px; font-size: 13px; color: #374151;">
                Security Deposit
                <span style="font-size: 12px; color: #9ca3af;">(refundable)</span>
            </td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 700; color: #1d4ed8; text-align: right; white-space: nowrap;">
                {{ $currency_symbol ?? '₵' }} {{ number_format($pricing->depositAmount, 2) }}
            </td>
        </tr>
        @endif
    </table>
    @endif

    {{-- CTA Button --}}
    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $confirmUrl }}"
           style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 15px; font-weight: 700;
                  padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
            &#10003; Confirm My Booking
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
            Or paste this link into your browser:<br>
            <a href="{{ $confirmUrl }}" style="color: #1d4ed8; word-break: break-all; font-size: 11px;">{{ $confirmUrl }}</a>
        </p>
    </div>

    {{-- Cancel link --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 32px;">
        Don't want this quote?
        <a href="{{ $cancelUrl }}" style="color: #dc2626; font-weight: 600;">Cancel this quote</a>
    </p>

    {{-- Contact --}}
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        Questions? Contact us at
        <a href="mailto:{{ config('app.support_email', 'info@swiftflitz.com') }}" style="color: #1d4ed8; font-weight: 600;">{{ config('app.support_email', 'info@swiftflitz.com') }}</a>
    </p>
@endsection
