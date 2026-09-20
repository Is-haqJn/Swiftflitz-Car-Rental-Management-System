<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Report' }} - Swiftflitz</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.5;
        }

        /* Fixed footer (repeats on every page) */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 36px;
            border-top: 2px solid #e5e7eb;
            background: #fff;
            padding: 0 36px;
        }
        .footer table { width: 100%; height: 36px; }
        .footer td { font-size: 8px; color: #9ca3af; vertical-align: middle; }
        .footer .right { text-align: right; }

        /* Page body margin accounts for fixed footer */
        .page-body { margin-bottom: 50px; }

        /* Header */
        .header {
            padding: 14px 36px 12px;
            border-bottom: 3px solid #126dff;
        }
        .header table { width: 100%; }
        .header td { vertical-align: top; }
        .header .logo-cell { width: 55%; vertical-align: top; }
        .header .title-cell { width: 45%; text-align: right; vertical-align: top; }
        .report-title {
            font-size: 15px;
            font-weight: bold;
            color: #00203f;
            letter-spacing: -0.2px;
        }
        .report-company {
            font-size: 8px;
            color: #6b7280;
            margin-top: 2px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .report-meta {
            font-size: 7.5px;
            color: #9ca3af;
            margin-top: 4px;
        }

        /* Content */
        .content { padding: 22px 36px 10px; }

        /* Section title */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #00203f;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-left: 3px solid #126dff;
            padding-left: 8px;
            margin: 22px 0 10px;
        }
        .section-title:first-child { margin-top: 0; }

        /* Stat cards (table-based for Dompdf background-color support) */
        table.stats-grid { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 20px; }
        td.stat-card {
            background-color: #f0f6ff;
            border: 1px solid #c7dffe;
            border-top: 3px solid #126dff;
            padding: 12px 14px;
            vertical-align: top;
        }
        td.stat-card.danger  { background-color: #fff1f2; border: 1px solid #fecdd3; border-top: 3px solid #dc2626; }
        td.stat-card.warn    { background-color: #fffbeb; border: 1px solid #fde68a; border-top: 3px solid #d97706; }
        td.stat-card.success { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-top: 3px solid #16a34a; }
        td.stat-card.dark    { background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3px solid #00203f; }

        .stat-label {
            font-size: 7.5px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            font-weight: bold;
        }
        .stat-value {
            font-size: 19px;
            font-weight: bold;
            color: #126dff;
            margin-top: 4px;
            line-height: 1.1;
        }
        .stat-value.dark    { color: #00203f; }
        .stat-value.danger  { color: #dc2626; }
        .stat-value.warn    { color: #d97706; }
        .stat-value.success { color: #16a34a; }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 9px;
        }
        table.data-table thead tr th {
            background: #00203f;
            color: #fff;
            padding: 8px 10px;
            text-align: left;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: bold;
        }
        table.data-table thead tr th:first-child { border-radius: 0; }
        table.data-table tbody tr td {
            padding: 7px 10px;
            border-bottom: 1px solid #f0f4f8;
            color: #374151;
            vertical-align: middle;
        }
        table.data-table tbody tr:nth-child(even) td { background: #f8fafc; }
        table.data-table tbody tr:last-child td { border-bottom: none; }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 7.5px;
            font-weight: bold;
            letter-spacing: 0.02em;
        }
        .badge-green  { background: #dcfce7; color: #15803d; }
        .badge-yellow { background: #fef9c3; color: #a16207; }
        .badge-red    { background: #fee2e2; color: #b91c1c; }
        .badge-blue   { background: #dbeafe; color: #1d4ed8; }
        .badge-gray   { background: #f3f4f6; color: #4b5563; }
        .badge-dark   { background: #e2e8f0; color: #00203f; }

        /* Divider */
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }

        /* Empty state */
        .empty { color: #9ca3af; font-size: 10px; padding: 20px 0; text-align: center; }

        /* Number align */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .fw-bold { font-weight: bold; }
        .text-primary { color: #126dff; }
        .text-muted { color: #6b7280; }
    </style>
</head>
<body>

@php
    $logoPath = resource_path('images/swiftflitz-logo.svg');
    $logo64   = file_exists($logoPath)
        ? 'data:image/svg+xml;base64,' . base64_encode(file_get_contents($logoPath))
        : null;
@endphp

{{-- Fixed footer (renders on every page) --}}
<div class="footer">
    <table>
        <tr>
            <td>&copy; {{ date('Y') }} Swiftflitz Car Rental &mdash; Confidential</td>
            <td class="right">Generated {{ $generated_at }}</td>
        </tr>
    </table>
</div>

<div class="page-body">

    {{-- Header --}}
    <div class="header">
        <table>
            <tr>
                <td class="logo-cell">
                    @if ($logo64)
                        <img src="{{ $logo64 }}" width="96" height="23" alt="Swiftflitz" />
                    @else
                        <span style="font-size: 16px; font-weight: bold; color: #00203f;">Swiftflitz</span>
                    @endif
                </td>
                <td class="title-cell">
                    <div class="report-title">{{ $title ?? 'Report' }}</div>
                    <div class="report-company">Car Rental Management System</div>
                    <div class="report-meta">
                        <div>@if (!empty($period))
                            <strong style="color: #374151;">Period:</strong> {{ $period['start'] ?? '' }} &ndash; {{ $period['end'] ?? '' }} &nbsp;&bull;&nbsp;
                        @else
                            <strong style="color: #374151;">Report Date:</strong> {{ now()->format('d M Y') }} &nbsp;&bull;&nbsp;
                        @endif
                        </div>
                        Prepared by: Swiftflitz Admin &nbsp;&bull;&nbsp; Confidential
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Report content --}}
    <div class="content">
        @yield('content')
    </div>

</div>

</body>
</html>
