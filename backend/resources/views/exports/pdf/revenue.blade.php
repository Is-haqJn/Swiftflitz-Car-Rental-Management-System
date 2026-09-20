@extends('exports.pdf.layout')
@php $title = 'Revenue Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card">
                <div class="stat-label">Collected Revenue</div>
                <div class="stat-value">GH₵ {{ number_format($data['summary']['collected_revenue'] ?? 0, 2) }}</div>
            </td>
            <td class="stat-card dark">
                <div class="stat-label">Total Rentals</div>
                <div class="stat-value dark">{{ number_format($data['summary']['total_rentals'] ?? 0) }}</div>
            </td>
            <td class="stat-card success">
                <div class="stat-label">Avg / Rental</div>
                <div class="stat-value success">GH₵ {{ number_format($data['summary']['average_per_rental'] ?? 0, 2) }}</div>
            </td>
            <td class="stat-card warn">
                <div class="stat-label">Outstanding Balance</div>
                <div class="stat-value warn">GH₵ {{ number_format($data['summary']['outstanding_balance'] ?? 0, 2) }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Daily Revenue Breakdown</div>

    @if (!empty($data['chart']))
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th class="text-center">Rentals</th>
                    <th class="text-right">Revenue (GH₵)</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['chart'] as $row)
                    <tr>
                        <td>{{ $row['date'] }}</td>
                        <td class="text-center">{{ $row['transaction_count'] ?? 0 }}</td>
                        <td class="text-right fw-bold text-primary">{{ number_format($row['revenue'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No revenue data available for the selected period.</p>
    @endif

@endsection
