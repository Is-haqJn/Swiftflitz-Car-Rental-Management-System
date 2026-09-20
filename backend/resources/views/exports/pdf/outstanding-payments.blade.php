@extends('exports.pdf.layout')
@php $title = 'Outstanding Payments Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card danger">
                <div class="stat-label">Total Outstanding</div>
                <div class="stat-value danger">GH₵ {{ number_format($data['summary']['total_outstanding'] ?? 0, 2) }}</div>
            </td>
            <td class="stat-card warn">
                <div class="stat-label">Pending Rentals</div>
                <div class="stat-value warn">{{ $data['summary']['pending_count'] ?? 0 }}</div>
            </td>
            <td class="stat-card">
                <div class="stat-label">Partial Payments</div>
                <div class="stat-value">{{ $data['summary']['partial_count'] ?? 0 }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Outstanding Payments</div>

    @if (!empty($data['rentals']))
        <table class="data-table">
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Pickup</th>
                    <th>Return</th>
                    <th class="text-center">Status</th>
                    <th class="text-right">Total (GH₵)</th>
                    <th class="text-center">Payment</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['rentals'] as $rental)
                    <tr>
                        <td class="fw-bold">{{ $rental['reference'] ?? substr($rental['id'], 0, 8) . '…' }}</td>
                        <td>{{ $rental['customer']['name'] ?? '-' }}</td>
                        <td class="text-muted">{{ $rental['vehicle']['name'] ?? '-' }}</td>
                        <td>{{ $rental['start_date'] ?? '-' }}</td>
                        <td>{{ $rental['return_date'] ?? $rental['end_date'] ?? '-' }}</td>
                        <td class="text-center">
                            <span class="badge {{ $rental['status'] === 'overdue' ? 'badge-red' : 'badge-yellow' }}">
                                {{ ucfirst($rental['status']) }}
                            </span>
                        </td>
                        <td class="text-right fw-bold">{{ number_format($rental['total_cost'], 2) }}</td>
                        <td class="text-center">
                            <span class="badge {{ $rental['payment_status'] === 'pending' ? 'badge-red' : 'badge-yellow' }}">
                                {{ ucfirst($rental['payment_status']) }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No outstanding payments found for the selected period.</p>
    @endif

@endsection
