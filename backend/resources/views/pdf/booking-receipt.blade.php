<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Booking Receipt - {{ $reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.5;
        }

        /* Fixed footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 36px;
            border-top: 1px solid #e5e7eb;
            background: #fff;
            padding: 0 36px;
        }
        .footer table { width: 100%; height: 36px; }
        .footer td { font-size: 8px; color: #9ca3af; vertical-align: middle; }
        .footer .right { text-align: right; }

        .page-body { margin-bottom: 50px; }

        /* Header */
        .header {
            padding: 18px 36px 14px;
            border-bottom: 3px solid #15803d;
        }
        .header table { width: 100%; }
        .header td { vertical-align: top; }

        /* Section */
        .content { padding: 20px 36px 10px; }

        .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-left: 3px solid #15803d;
            padding-left: 7px;
            margin: 18px 0 8px;
        }
        .section-title:first-child { margin-top: 0; }

        /* Info table */
        table.info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        table.info-table td {
            font-size: 9.5px;
            padding: 3px 0;
            vertical-align: top;
        }
        table.info-table td.label {
            color: #6b7280;
            width: 38%;
        }
        table.info-table td.value {
            color: #111827;
            font-weight: 600;
        }

        /* Cost table */
        table.cost-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        table.cost-table tr td {
            font-size: 9.5px;
            padding: 4px 0;
            vertical-align: middle;
            border-bottom: 1px solid #f3f4f6;
        }
        table.cost-table tr:last-child td { border-bottom: none; }
        table.cost-table td.desc { color: #374151; }
        table.cost-table td.amount { text-align: right; color: #111827; font-weight: 600; white-space: nowrap; }
        table.cost-table tr.subtotal-row td { border-top: 1px solid #e5e7eb; padding-top: 7px; }
        table.cost-table tr.discount-row td { color: #166534; }
        table.cost-table tr.discounted-subtotal-row td { border-top: 1px solid #e5e7eb; padding-top: 7px; color: #6b7280; }
        table.cost-table tr.total-row td {
            border-top: 2px solid #374151;
            border-bottom: none;
            padding-top: 8px;
            font-size: 11px;
            font-weight: bold;
            color: #111827;
        }
        table.cost-table tr.grand-total-row td {
            border-top: 2px solid #111827;
            border-bottom: none;
            padding-top: 8px;
            font-size: 12px;
            font-weight: bold;
            color: #111827;
            background-color: #f9fafb;
        }

        /* Reference badge */
        .ref-badge {
            display: inline-block;
            background-color: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 14px;
            font-weight: bold;
            color: #15803d;
            letter-spacing: 0.5px;
        }

        .badge-amber {
            display: inline-block;
            background-color: #fef3c7;
            color: #92400e;
            border-radius: 3px;
            padding: 1px 6px;
            font-size: 8px;
            font-weight: bold;
        }

        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }

        .note-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 16px;
            font-size: 9px;
            color: #166534;
            line-height: 1.6;
        }
    </style>
</head>
<body>

@php
    $logoPath    = resource_path('images/swiftflitz-logo.svg');
    $logo64      = file_exists($logoPath)
        ? 'data:image/svg+xml;base64,' . base64_encode(file_get_contents($logoPath))
        : null;
    $companyName = app(\App\Settings\GeneralSettings::class)->site_name ?: config('app.name');
@endphp

{{-- Fixed footer --}}
<div class="footer">
    <table>
        <tr>
            <td>Booking Receipt &mdash; {{ $reference }}</td>
            <td class="right">Issued {{ $issuedAt }}</td>
        </tr>
    </table>
</div>

<div class="page-body">

    {{-- Header --}}
    <div class="header">
        <table>
            <tr>
                <td style="width: 50%; vertical-align: middle;">
                    @if ($logo64)
                        <img src="{{ $logo64 }}" width="96" height="23" alt="{{ $companyName }}" />
                    @else
                        <span style="font-size: 16px; font-weight: bold; color: #00203f;">{{ $companyName }}</span>
                    @endif
                    <div style="font-size: 8px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em;">Car Rental</div>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: middle;">
                    <div style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Booking Receipt</div>
                    <div class="ref-badge">{{ $reference }}</div>
                    <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">Issued {{ $issuedAt }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">

        {{-- Customer & Booking details side by side --}}
        <div class="section-title">Customer &amp; Booking Details</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                {{-- Customer --}}
                <td style="width: 48%; vertical-align: top; padding-right: 12px;">
                    <table class="info-table">
                        <tr>
                            <td class="label">Name</td>
                            <td class="value">{{ $customerName }}</td>
                        </tr>
                        @if ($customerEmail)
                        <tr>
                            <td class="label">Email</td>
                            <td class="value">{{ $customerEmail }}</td>
                        </tr>
                        @endif
                        @if ($customerPhone)
                        <tr>
                            <td class="label">Phone</td>
                            <td class="value">{{ $customerPhone }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
                {{-- Booking --}}
                <td style="width: 52%; vertical-align: top; border-left: 1px solid #e5e7eb; padding-left: 14px;">
                    <table class="info-table">
                        <tr>
                            <td class="label">Vehicle</td>
                            <td class="value">{{ $vehicleName }}</td>
                        </tr>
                        <tr>
                            <td class="label">Pickup</td>
                            <td class="value">{{ $pickupDate }}@if ($pickupTime) at {{ $pickupTime }}@endif</td>
                        </tr>
                        <tr>
                            <td class="label">Return</td>
                            <td class="value">{{ $returnDate }}@if ($returnTime) at {{ $returnTime }}@endif</td>
                        </tr>
                        @if ($pickupLocation)
                        <tr>
                            <td class="label">Pickup Location</td>
                            <td class="value">{{ $pickupLocation }}</td>
                        </tr>
                        @endif
                        @if ($dropoffLocation)
                        <tr>
                            <td class="label">Drop-off</td>
                            <td class="value">{{ $dropoffLocation }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>

        <hr class="divider">

        {{-- Cost breakdown --}}
        <div class="section-title">Payment Summary</div>
        <table class="cost-table">
            {{-- Vehicle hire --}}
            <tr>
                <td class="desc">
                    Vehicle hire &mdash; {{ $rentalDays }} {{ $rentalDays == 1 ? 'day' : 'days' }}
                    &times; {{ $currency_symbol }} {{ number_format($dailyRate, 2) }}/day
                </td>
                <td class="amount">{{ $currency_symbol }} {{ number_format($baseCost, 2) }}</td>
            </tr>
            {{-- Addon charges --}}
            @foreach ($addonCharges as $charge)
            <tr>
                <td class="desc">{{ $charge['label'] ?? $charge['name'] ?? 'Add-on' }}</td>
                <td class="amount">{{ $currency_symbol }} {{ number_format((float) ($charge['amount'] ?? 0), 2) }}</td>
            </tr>
            @endforeach
            {{-- Location charges (individual lines with labels) --}}
            @foreach ($locationCharges as $loc)
            <tr>
                <td class="desc">{{ $loc['label'] ?? 'Location charge' }}</td>
                <td class="amount">{{ $currency_symbol }} {{ number_format((float) ($loc['amount'] ?? 0), 2) }}</td>
            </tr>
            @endforeach
            {{-- Subtotal (shown when there are extras beyond base) --}}
            @if (count($addonCharges) > 0 || count($locationCharges) > 0 || $discountAmount > 0)
            <tr class="subtotal-row">
                <td class="desc" style="color: #6b7280;">Subtotal</td>
                <td class="amount" style="color: #6b7280;">{{ $currency_symbol }} {{ number_format($subtotal, 2) }}</td>
            </tr>
            @endif
            {{-- Discount --}}
            @if ($discountAmount > 0)
            <tr class="discount-row">
                <td class="desc">Discount</td>
                <td class="amount">-{{ $currency_symbol }} {{ number_format($discountAmount, 2) }}</td>
            </tr>
            {{-- Discounted subtotal --}}
            <tr class="discounted-subtotal-row">
                <td class="desc">Discounted Subtotal</td>
                <td class="amount">{{ $currency_symbol }} {{ number_format($discountedSubtotal, 2) }}</td>
            </tr>
            @endif
            {{-- VAT --}}
            @if ($vatAmount !== null && $vatAmount > 0)
            <tr>
                <td class="desc" style="color: #6b7280;">VAT</td>
                <td class="amount" style="color: #6b7280;">{{ $currency_symbol }} {{ number_format($vatAmount, 2) }}</td>
            </tr>
            @endif
            {{-- Rental Total --}}
            <tr class="total-row">
                <td class="desc">Rental Total</td>
                <td class="amount">{{ $currency_symbol }} {{ number_format($totalCost, 2) }}</td>
            </tr>
            {{-- Security deposit --}}
            @if (!$skipDeposit && $depositPaid > 0)
            <tr>
                <td class="desc">
                    Security Deposit (Held)
                    <span class="badge-amber">Refundable</span>
                </td>
                <td class="amount">{{ $currency_symbol }} {{ number_format($depositPaid, 2) }}</td>
            </tr>
            {{-- Total Charged --}}
            <tr class="grand-total-row">
                <td class="desc" style="padding-left: 6px;">Total Charged</td>
                <td class="amount" style="padding-right: 6px;">{{ $currency_symbol }} {{ number_format($totalCost + $depositPaid, 2) }}</td>
            </tr>
            @endif
        </table>

        {{-- Deposit note --}}
        @if (!$skipDeposit && $depositPaid > 0)
        <div class="note-box">
            The security deposit of <strong>{{ $currency_symbol }} {{ number_format($depositPaid, 2) }}</strong> is held and will be
            fully refunded upon return of the vehicle in satisfactory condition.
        </div>
        @endif

    </div>
</div>

</body>
</html>
