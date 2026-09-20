@extends('exports.pdf.layout')
@php $title = 'Maintenance & Repairs Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card warn">
                <div class="stat-label">In Maintenance</div>
                <div class="stat-value warn">{{ $data['summary']['maintenance_count'] ?? 0 }}</div>
            </td>
            <td class="stat-card danger">
                <div class="stat-label">Damage Reports</div>
                <div class="stat-value danger">{{ $data['summary']['damage_reports_count'] ?? 0 }}</div>
            </td>
        </tr>
    </table>

    @if (!empty($data['maintenance_vehicles']))
        <div class="section-title">Vehicles Under Maintenance</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>License Plate</th>
                    <th>Category</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['maintenance_vehicles'] as $vehicle)
                    <tr>
                        <td class="fw-bold">{{ $vehicle['name'] }}</td>
                        <td><span class="badge badge-dark">{{ $vehicle['license_plate'] }}</span></td>
                        <td class="text-muted">{{ $vehicle['category'] }}</td>
                        <td class="text-center">
                            <span class="badge badge-yellow">{{ ucfirst($vehicle['status']) }}</span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No vehicles currently under maintenance.</p>
    @endif

    @if (!empty($data['recent_damage_reports']))
        <div class="section-title">Recent Damage Reports</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>Inspection Type</th>
                    <th>Notes</th>
                    <th class="text-right">Damage Cost (GH₵)</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['recent_damage_reports'] as $report)
                    <tr>
                        <td class="fw-bold">{{ $report['vehicle_name'] }}</td>
                        <td>
                            <span class="badge badge-blue">{{ ucfirst($report['inspection_type']) }}</span>
                        </td>
                        <td class="text-muted">{{ Str::limit($report['notes'] ?? '-', 55) }}</td>
                        <td class="text-right fw-bold {{ ($report['damage_cost'] ?? 0) > 0 ? 'text-danger' : '' }}">
                            {{ number_format($report['damage_cost'] ?? 0, 2) }}
                        </td>
                        <td class="text-muted">{{ $report['created_at'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

@endsection
