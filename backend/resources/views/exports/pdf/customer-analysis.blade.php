@extends('exports.pdf.layout')
@php $title = 'Customer Analysis Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card dark">
                <div class="stat-label">Total Customers</div>
                <div class="stat-value dark">{{ $data['summary']['total_customers'] ?? 0 }}</div>
            </td>
            <td class="stat-card success">
                <div class="stat-label">New This Period</div>
                <div class="stat-value success">{{ $data['summary']['new_customers'] ?? 0 }}</div>
            </td>
            <td class="stat-card danger">
                <div class="stat-label">Blacklisted</div>
                <div class="stat-value danger">{{ $data['summary']['blacklisted_count'] ?? 0 }}</div>
            </td>
            <td class="stat-card warn">
                <div class="stat-label">Expiring Licenses</div>
                <div class="stat-value warn">{{ $data['summary']['expiring_licenses'] ?? 0 }}</div>
            </td>
        </tr>
    </table>

    @if (!empty($data['top_customers']))
        <div class="section-title">Top Customers by Rental Activity</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th class="text-center">Rentals</th>
                    <th class="text-right">Total Spent (GH₵)</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['top_customers'] as $i => $customer)
                    <tr>
                        <td class="text-muted">{{ $i + 1 }}</td>
                        <td class="fw-bold">{{ $customer['name'] }}</td>
                        <td class="text-muted">{{ $customer['email'] }}</td>
                        <td>{{ $customer['phone'] ?? '-' }}</td>
                        <td class="text-center">{{ $customer['rentals_count'] }}</td>
                        <td class="text-right fw-bold text-primary">{{ number_format($customer['total_spend'] ?? 0, 2) }}</td>
                        <td class="text-center">
                            @if (!empty($customer['is_blacklisted']))
                                <span class="badge badge-red">Blacklisted</span>
                            @else
                                <span class="badge badge-green">Active</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if (!empty($data['license_expiry_alerts']))
        <div class="section-title">License Expiry Alerts &mdash; Next 30 Days</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>License Number</th>
                    <th class="text-center">Expiry Date</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['license_expiry_alerts'] as $customer)
                    <tr>
                        <td class="fw-bold">{{ $customer['name'] }}</td>
                        <td class="text-muted">{{ $customer['email'] }}</td>
                        <td>{{ $customer['license_number'] }}</td>
                        <td class="text-center">
                            <span class="badge badge-yellow">{{ $customer['license_expiry'] }}</span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

@endsection
