@extends('exports.pdf.layout')
@php $title = 'Vehicle Utilization Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card dark">
                <div class="stat-label">Total Vehicles</div>
                <div class="stat-value dark">{{ $data['summary']['total_vehicles'] ?? 0 }}</div>
            </td>
            <td class="stat-card">
                <div class="stat-label">Currently Rented</div>
                <div class="stat-value">{{ $data['summary']['rented_count'] ?? 0 }}</div>
            </td>
            <td class="stat-card success">
                <div class="stat-label">Available</div>
                <div class="stat-value success">{{ $data['summary']['available_count'] ?? 0 }}</div>
            </td>
            <td class="stat-card warn">
                <div class="stat-label">In Maintenance</div>
                <div class="stat-value warn">{{ $data['summary']['maintenance_count'] ?? 0 }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Vehicle Details</div>

    @if (!empty($data['vehicles']))
        <table class="data-table">
            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>Plate</th>
                    <th>Category</th>
                    <th class="text-center">Status</th>
                    <th class="text-center">Rentals</th>
                    <th class="text-center">Utilization</th>
                    <th class="text-right">Revenue (GH₵)</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['vehicles'] as $vehicle)
                    <tr>
                        <td class="fw-bold">{{ $vehicle['name'] }}</td>
                        <td>
                            <span class="badge badge-dark">{{ $vehicle['license_plate'] }}</span>
                        </td>
                        <td class="text-muted">{{ $vehicle['category'] }}</td>
                        <td class="text-center">
                            @php
                                $statusClass = match($vehicle['status']) {
                                    'available'   => 'badge-green',
                                    'rented'      => 'badge-blue',
                                    'maintenance' => 'badge-yellow',
                                    default       => 'badge-gray',
                                };
                            @endphp
                            <span class="badge {{ $statusClass }}">{{ ucfirst($vehicle['status']) }}</span>
                        </td>
                        <td class="text-center">{{ $vehicle['total_rentals'] }}</td>
                        <td class="text-center">{{ $vehicle['utilization_rate'] }}%</td>
                        <td class="text-right fw-bold text-primary">{{ number_format($vehicle['total_revenue'] ?? 0, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No vehicle data available for the selected period.</p>
    @endif

@endsection
