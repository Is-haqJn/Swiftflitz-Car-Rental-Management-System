<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Chauffeur Booking {{ ucfirst($variant) }} - {{ $reference }}</title>
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
        table.info-table td.label { color: #6b7280; width: 38%; }
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
        table.cost-table tr.total-row td {
            border-top: 2px solid #374151;
            border-bottom: none;
            padding-top: 8px;
            font-size: 11px;
            font-weight: bold;
            color: #111827;
        }

        .ref-badge {
            display: inline-block;
            background-color: #eff6ff;
            border: 1px solid #93c5fd;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 14px;
            font-weight: bold;
            color: #1d4ed8;
            letter-spacing: 0.5px;
        }

        .doc-type-badge {
            display: inline-block;
            background-color: {{ $variant === 'receipt' ? '#f0fdf4' : '#fefce8' }};
            border: 1px solid {{ $variant === 'receipt' ? '#86efac' : '#fde047' }};
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: bold;
            color: {{ $variant === 'receipt' ? '#166534' : '#854d0e' }};
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }

        .pending-note {
            background-color: #fefce8;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 16px;
            font-size: 9px;
            color: #713f12;
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

<div class="footer">
    <table>
        <tr>
            <td>Chauffeur Booking {{ ucfirst($variant) }} &mdash; {{ $reference }}</td>
            <td class="right">Issued {{ $issuedAt }}</td>
        </tr>
    </table>
</div>

<div class="page-body">

    <div class="header">
        <table>
            <tr>
                <td style="width: 50%; vertical-align: middle;">
                    @if ($logo64)
                        <img src="{{ $logo64 }}" width="96" height="23" alt="{{ $companyName }}" />
                    @else
                        <span style="font-size: 16px; font-weight: bold; color: #00203f;">{{ $companyName }}</span>
                    @endif
                    <div style="font-size: 8px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em;">Chauffeur Services</div>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: middle;">
                    <div style="margin-bottom: 4px;"><span class="doc-type-badge">{{ $variant }}</span></div>
                    <div class="ref-badge">{{ $reference }}</div>
                    <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">Issued {{ $issuedAt }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">

        <div class="section-title">Customer &amp; Trip Details</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-right: 12px;">
                    <table class="info-table">
                        <tr>
                            <td class="label">Customer</td>
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
                        @if ($expectedDestination)
                        <tr>
                            <td class="label">Destination</td>
                            <td class="value">{{ $expectedDestination }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
                <td style="width: 52%; vertical-align: top; border-left: 1px solid #e5e7eb; padding-left: 14px;">
                    <table class="info-table">
                        <tr>
                            <td class="label">Vehicle</td>
                            <td class="value">{{ $vehicleName }}</td>
                        </tr>
                        <tr>
                            <td class="label">Pickup Time</td>
                            <td class="value">{{ $pickupTime }}</td>
                        </tr>
                        <tr>
                            <td class="label">Return Time</td>
                            <td class="value">{{ $returnTime }}</td>
                        </tr>
                        @if ($pickupLocation)
                        <tr>
                            <td class="label">Pickup Location</td>
                            <td class="value">{{ $pickupLocation }}</td>
                        </tr>
                        @endif
                        @if ($driverName)
                        <tr>
                            <td class="label">Driver</td>
                            <td class="value">{{ $driverName }}@if ($driverPhone) &bull; {{ $driverPhone }}@endif</td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>

        <hr class="divider">

        <div class="section-title">Payment Summary</div>
        <table class="cost-table">
            <tr>
                <td class="desc">Base service rate</td>
                <td class="amount">GHS {{ number_format($basePrice, 2) }}</td>
            </tr>
            @if ($pickupCharge > 0)
            <tr>
                <td class="desc">Pickup location surcharge</td>
                <td class="amount">GHS {{ number_format($pickupCharge, 2) }}</td>
            </tr>
            @endif
            @if ($vatAmount !== null && $vatAmount > 0)
            <tr>
                <td class="desc" style="color: #6b7280;">VAT</td>
                <td class="amount" style="color: #6b7280;">GHS {{ number_format($vatAmount, 2) }}</td>
            </tr>
            @endif
            @if ($overtimeCharge > 0)
            <tr>
                <td class="desc">Overtime ({{ $overtimeHours }}h)</td>
                <td class="amount">GHS {{ number_format($overtimeCharge, 2) }}</td>
            </tr>
            @endif
            <tr class="total-row">
                <td class="desc">Total</td>
                <td class="amount">GHS {{ number_format($totalAmount, 2) }}</td>
            </tr>
        </table>

        @if ($variant === 'invoice')
        <div class="pending-note">
            <strong>Payment Pending</strong> - This is a pro-forma invoice. Payment is due before or at the time of service.
        </div>
        @endif

    </div>
</div>

</body>
</html>
