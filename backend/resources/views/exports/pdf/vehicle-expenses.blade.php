@extends('exports.pdf.layout')
@php $title = 'Vehicle Expense Report'; @endphp

@section('content')

    <table class="stats-grid">
        <tr>
            <td class="stat-card danger">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value danger">GH₵ {{ number_format($data['summary']['total_expenses'] ?? 0, 2) }}</div>
            </td>
            <td class="stat-card dark">
                <div class="stat-label">Total Records</div>
                <div class="stat-value dark">{{ number_format($data['summary']['total_records'] ?? 0) }}</div>
            </td>
        </tr>
    </table>

    @if (!empty($data['by_vehicle']))
        <div class="section-title">Expenses by Vehicle</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>License Plate</th>
                    <th class="text-center">Records</th>
                    <th class="text-right">Total (GH₵)</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['by_vehicle'] as $row)
                    <tr>
                        <td class="fw-bold">{{ $row['vehicle'] ?? '-' }}</td>
                        <td><span class="badge badge-dark">{{ $row['license_plate'] ?? '-' }}</span></td>
                        <td class="text-center">{{ $row['count'] }}</td>
                        <td class="text-right fw-bold text-primary">{{ number_format($row['total'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No expense records available for the selected period.</p>
    @endif

    @if (!empty($data['expenses']))
        <div class="section-title">Expense Details</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Recorded By</th>
                    <th class="text-right">Amount (GH₵)</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['expenses'] as $expense)
                    <tr>
                        <td class="text-muted">{{ $expense['expense_date'] }}</td>
                        <td class="fw-bold">{{ $expense['vehicle'] ?? '-' }}</td>
                        <td>
                            <span class="badge badge-blue">{{ ucfirst(str_replace('_', ' ', $expense['expense_type'])) }}</span>
                        </td>
                        <td class="text-muted">{{ \Illuminate\Support\Str::limit($expense['description'] ?? '', 50) }}</td>
                        <td class="text-muted">{{ $expense['recorded_by'] ?? '-' }}</td>
                        <td class="text-right fw-bold text-primary">{{ number_format($expense['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

@endsection
