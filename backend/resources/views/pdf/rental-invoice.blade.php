<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Rental Invoice - {{ $rental->reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.5;
        }

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

        .header {
            padding: 18px 36px 14px;
            border-bottom: 3px solid #1d4ed8;
        }
        .header table { width: 100%; }
        .header td { vertical-align: top; }

        .content { padding: 20px 36px 10px; }

        .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-left: 3px solid #1d4ed8;
            padding-left: 7px;
            margin: 18px 0 8px;
        }
        .section-title:first-child { margin-top: 0; }

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
        table.info-table td.label { color: #6b7280; width: 40%; }
        table.info-table td.value { color: #111827; font-weight: 600; }

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
        table.cost-table td.note { font-size: 8.5px; color: #6b7280; }
        table.cost-table tr.subtotal-row td { border-top: 1px solid #e5e7eb; padding-top: 6px; color: #6b7280; }
        table.cost-table tr.discount-row td { color: #166534; }
        table.cost-table tr.vat-row td { color: #6b7280; }
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
            font-size: 11px;
            font-weight: bold;
            color: #111827;
        }
        table.cost-table tr.payment-row td { color: #495057; }
        table.cost-table tr.balance-row td { color: #dc2626; font-weight: bold; }
        table.cost-table tr.paid-row td { color: #15803d; font-weight: bold; font-size: 11px; }

        .ref-badge {
            display: inline-block;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 14px;
            font-weight: bold;
            color: #1d4ed8;
            letter-spacing: 0.5px;
        }

        .doc-type-label {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 4px;
        }

        .badge-green {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            border-radius: 3px;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .badge-red {
            display: inline-block;
            background-color: #fee2e2;
            color: #991b1b;
            border-radius: 3px;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }

        .note-box {
            background-color: #fefce8;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 16px;
            font-size: 9px;
            color: #78350f;
            line-height: 1.6;
        }
    </style>
</head>
<body>

@php
    $isPaid = $rental->payment_status?->value === 'paid';
    $docType = $isPaid ? 'RECEIPT' : 'INVOICE';
    $docColor = $isPaid ? '#15803d' : '#1d4ed8';
    $symbol = $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? '₵';
    /* PDF-safe: DejaVu Sans lacks many non-ASCII currency glyphs (₵, ₦, etc.) - use ISO code instead */
    $pdfSafeSymbol = preg_match('/^[\x00-\x7F]+$/', $symbol) ? $symbol : ($rental->currency ?? 'GHS');

    $charges = collect($rental->applied_charges_breakdown ?? []);
    $addonLines = $charges->filter(fn ($c) => ($c['type'] ?? '') === 'addon')->values();
    $locationLines = $charges->filter(fn ($c) => ($c['type'] ?? '') === 'location')->values();
    $baseLine = $charges->first(fn ($c) => ($c['type'] ?? '') === 'base');

    $baseCost = $baseLine ? (float) $baseLine['amount'] : (float) ($rental->base_cost ?? 0);
    $dailyRate = (float) ($rental->daily_rate ?? 0);
    $rentalDays = (int) ($rental->rental_days ?? 1);
    $subtotal = (float) ($rental->subtotal ?? 0);
    $discountAmount = (float) ($rental->total_discount_amount ?? 0);
    $vatAmount = $rental->vat_amount !== null ? (float) $rental->vat_amount : null;
    $totalCost = (float) ($rental->total_cost ?? 0);
    $amountPaid = (float) ($rental->amount_paid ?? 0);
    $depositPaid = (float) ($rental->deposit_paid ?? 0);
    $depositApplied = (float) ($rental->deposit_applied_to_balance ?? 0);
    $amountDue = max(0.0, (float) ($rental->amount_due ?? 0));
    $overdueFee = (float) ($rental->overdue_fee ?? 0);
    $latePickupFee = (float) ($rental->late_pickup_fee ?? 0);
    $grandTotal = $totalCost + $overdueFee + $latePickupFee;

    $companyName = $generalSettings->site_name ?? config('app.name');
    $companyAddress = $generalSettings->site_address ?? null;
    $companyEmail = $generalSettings->site_email ?? null;
    $companyPhone = $generalSettings->site_phone ?? null;

    $logoPath = resource_path('images/swiftflitz-logo.svg');
    $logo64 = file_exists($logoPath)
        ? 'data:image/svg+xml;base64,' . base64_encode(file_get_contents($logoPath))
        : null;

    $issuedAt = now()->format('D, M j, Y');
    $pickupDateFmt = $rental->pickup_date ? \Carbon\Carbon::parse($rental->pickup_date)->format('D, M j, Y') : null;
    $returnDateFmt = $rental->return_date ? \Carbon\Carbon::parse($rental->return_date)->format('D, M j, Y') : null;
    $createdAtFmt = $rental->created_at ? \Carbon\Carbon::parse($rental->created_at)->format('D, M j, Y') : $issuedAt;
@endphp

{{-- Fixed footer --}}
<div class="footer">
    <table>
        <tr>
            <td>{{ $docType }} &mdash; {{ $rental->reference }}</td>
            <td class="right">Issued {{ $issuedAt }}</td>
        </tr>
    </table>
</div>

<div class="page-body">

    {{-- Header --}}
    <div class="header">
        <table>
            <tr>
                {{-- Company info --}}
                <td style="width: 55%; vertical-align: middle;">
                    @if ($logo64)
                        <img src="{{ $logo64 }}" width="96" height="23" alt="{{ $companyName }}" />
                    @else
                        <span style="font-size: 15px; font-weight: bold; color: #00203f;">{{ $companyName }}</span>
                    @endif
                    <div style="font-size: 8px; color: #6b7280; margin-top: 4px; line-height: 1.6;">
                        @if ($companyAddress)<div>{{ $companyAddress }}</div>@endif
                        @if ($companyEmail)<div>{{ $companyEmail }}</div>@endif
                        @if ($companyPhone)<div>{{ $companyPhone }}</div>@endif
                    </div>
                </td>
                {{-- Document type + meta --}}
                <td style="width: 45%; text-align: right; vertical-align: top;">
                    <div class="doc-type-label" style="color: {{ $docColor }}; margin-bottom: 6px;">{{ $docType }}</div>
                    <div class="ref-badge">{{ $rental->reference }}</div>
                    <div style="font-size: 8px; color: #6b7280; margin-top: 6px; line-height: 1.8;">
                        <div>Date: {{ $createdAtFmt }}</div>
                        @if ($isPaid)
                            <div>Status: <span style="color: #15803d; font-weight: bold;">Paid in Full</span></div>
                        @elseif ($returnDateFmt)
                            <div>Due by: {{ $returnDateFmt }}</div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">

        {{-- Billed To / Vehicle / Rental Period (3 columns) --}}
        <div class="section-title">Rental Details</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                {{-- Billed To --}}
                <td style="width: 33%; vertical-align: top; padding-right: 10px;">
                    <div style="font-size: 8px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px;">Billed To</div>
                    <table class="info-table">
                        <tr>
                            <td class="label">Name</td>
                            <td class="value">{{ $rental->customer?->name ?? '-' }}</td>
                        </tr>
                        @if ($rental->customer?->phone)
                        <tr>
                            <td class="label">Phone</td>
                            <td class="value">{{ $rental->customer->phone }}</td>
                        </tr>
                        @endif
                        @if ($rental->customer?->email)
                        <tr>
                            <td class="label">Email</td>
                            <td class="value" style="font-size: 8.5px;">{{ $rental->customer->email }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
                {{-- Vehicle --}}
                <td style="width: 33%; vertical-align: top; border-left: 1px solid #e5e7eb; padding: 0 10px;">
                    <div style="font-size: 8px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px;">Vehicle</div>
                    <table class="info-table">
                        <tr>
                            <td class="label">Name</td>
                            <td class="value">{{ $rental->vehicle?->name ?? '-' }}</td>
                        </tr>
                        @if ($rental->vehicle?->license_plate)
                        <tr>
                            <td class="label">Plate</td>
                            <td class="value">{{ $rental->vehicle->license_plate }}</td>
                        </tr>
                        @endif
                        @if ($rental->vehicle?->category?->name)
                        <tr>
                            <td class="label">Category</td>
                            <td class="value">{{ $rental->vehicle->category->name }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
                {{-- Rental Period --}}
                <td style="width: 34%; vertical-align: top; border-left: 1px solid #e5e7eb; padding-left: 10px;">
                    <div style="font-size: 8px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px;">Rental Period</div>
                    <table class="info-table">
                        @if ($pickupDateFmt)
                        <tr>
                            <td class="label">Pickup</td>
                            <td class="value">{{ $pickupDateFmt }}@if ($rental->pickup_time) &middot; {{ $rental->pickup_time }}@endif</td>
                        </tr>
                        @endif
                        @if ($returnDateFmt)
                        <tr>
                            <td class="label">Return</td>
                            <td class="value">{{ $returnDateFmt }}@if ($rental->return_time) &middot; {{ $rental->return_time }}@endif</td>
                        </tr>
                        @endif
                        <tr>
                            <td class="label">Duration</td>
                            <td class="value">{{ $rentalDays }} {{ $rentalDays === 1 ? 'day' : 'days' }}</td>
                        </tr>
                        @if ($rental->pickupLocation?->name)
                        <tr>
                            <td class="label">Pickup Loc.</td>
                            <td class="value">{{ $rental->pickupLocation->name }}</td>
                        </tr>
                        @endif
                        @if ($rental->dropoffLocation?->name)
                        <tr>
                            <td class="label">Drop-off</td>
                            <td class="value">{{ $rental->dropoffLocation->name }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>

        <hr class="divider">

        {{-- Line Items --}}
        <div class="section-title">Charges</div>
        <table class="cost-table">
            {{-- Vehicle rental base --}}
            <tr>
                <td class="desc">
                    Vehicle rental
                    @if ($dailyRate > 0)
                        <span style="color: #6b7280; font-size: 8.5px;">
                            ({{ $rentalDays }} {{ $rentalDays === 1 ? 'day' : 'days' }} &times; {{ $pdfSafeSymbol }}{{ number_format($dailyRate, 2) }})
                        </span>
                    @endif
                </td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($baseCost, 2) }}</td>
            </tr>

            {{-- Addon charges --}}
            @foreach ($addonLines as $charge)
            <tr>
                <td class="desc">{{ $charge['label'] ?? $charge['name'] ?? 'Add-on' }}</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format((float) ($charge['amount'] ?? 0), 2) }}</td>
            </tr>
            @endforeach

            {{-- Location charges --}}
            @foreach ($locationLines as $loc)
            <tr>
                <td class="desc">{{ $loc['label'] ?? 'Location charge' }}</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format((float) ($loc['amount'] ?? 0), 2) }}</td>
            </tr>
            @endforeach

            {{-- Subtotal (when there are extras or discount) --}}
            @if ($addonLines->count() > 0 || $locationLines->count() > 0 || $discountAmount > 0)
            <tr class="subtotal-row">
                <td class="desc">Subtotal</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($subtotal, 2) }}</td>
            </tr>
            @endif

            {{-- Discount --}}
            @if ($discountAmount > 0)
            <tr class="discount-row">
                <td class="desc">
                    Discount
                    @if ($rental->coupon_applied['code'] ?? null)
                        <span style="font-size: 8px; color: #6b7280;">({{ $rental->coupon_applied['code'] }})</span>
                    @elseif ($rental->manual_discount_reason)
                        <span style="font-size: 8px; color: #6b7280;">({{ $rental->manual_discount_reason }})</span>
                    @endif
                </td>
                <td class="amount">-{{ $pdfSafeSymbol }}{{ number_format($discountAmount, 2) }}</td>
            </tr>
            @endif

            {{-- VAT --}}
            @if ($vatAmount !== null && $vatAmount > 0)
            <tr class="vat-row">
                <td class="desc">VAT</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($vatAmount, 2) }}</td>
            </tr>
            @endif

            {{-- Rental Total --}}
            <tr class="total-row">
                <td class="desc">Rental Total</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($totalCost, 2) }}</td>
            </tr>

            {{-- Overdue fee --}}
            @if ($overdueFee > 0)
            <tr>
                <td class="desc" style="color: #dc2626;">Overdue fee</td>
                <td class="amount" style="color: #dc2626;">{{ $pdfSafeSymbol }}{{ number_format($overdueFee, 2) }}</td>
            </tr>
            @endif

            {{-- Late pickup fee --}}
            @if ($latePickupFee > 0)
            <tr>
                <td class="desc" style="color: #dc2626;">Late pickup fee</td>
                <td class="amount" style="color: #dc2626;">{{ $pdfSafeSymbol }}{{ number_format($latePickupFee, 2) }}</td>
            </tr>
            @endif

            {{-- Grand Total (only when post-total fees exist) --}}
            @if ($overdueFee > 0 || $latePickupFee > 0)
            <tr class="grand-total-row">
                <td class="desc">Grand Total</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($grandTotal, 2) }}</td>
            </tr>
            @endif
        </table>

        <hr class="divider">

        {{-- Payment Summary --}}
        <div class="section-title">Payment Summary</div>
        <table class="cost-table">
            {{-- Security deposit applied --}}
            @if ($depositApplied > 0)
            <tr class="payment-row">
                <td class="desc">Security deposit applied</td>
                <td class="amount">-{{ $pdfSafeSymbol }}{{ number_format($depositApplied, 2) }}</td>
            </tr>
            @endif

            {{-- Amount paid --}}
            <tr class="payment-row">
                <td class="desc">Amount paid</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($amountPaid, 2) }}</td>
            </tr>

            {{-- Balance due or Paid in Full --}}
            @if ($isPaid)
            <tr class="paid-row">
                <td class="desc">Balance due</td>
                <td class="amount"><span class="badge-green">PAID IN FULL</span></td>
            </tr>
            @elseif ($amountDue > 0)
            <tr class="balance-row">
                <td class="desc">Balance due</td>
                <td class="amount">{{ $pdfSafeSymbol }}{{ number_format($amountDue, 2) }}</td>
            </tr>
            @else
            <tr class="paid-row">
                <td class="desc">Balance due</td>
                <td class="amount"><span class="badge-green">PAID IN FULL</span></td>
            </tr>
            @endif
        </table>

        {{-- Staff note --}}
        @isset($note)
        @if ($note)
        <div class="note-box">
            <strong>Note:</strong> {{ $note }}
        </div>
        @endif
        @endisset

    </div>
</div>

</body>
</html>
