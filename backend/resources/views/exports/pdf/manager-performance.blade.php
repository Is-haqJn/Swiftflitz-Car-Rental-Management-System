@extends('exports.pdf.layout')
@php $title = 'Manager Performance Report'; @endphp

@section('content')

    <div class="section-title">Manager Performance Summary</div>

    @if (!empty($data['managers']))
        <table class="data-table">
            <thead>
                <tr>
                    <th>Manager</th>
                    <th class="text-center">Total Rentals</th>
                    <th class="text-center">Completed</th>
                    <th class="text-center">Cancelled</th>
                    <th class="text-right">Revenue (GH₵)</th>
                    <th class="text-center">Avg Days</th>
                    <th class="text-center">Completion Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['managers'] as $manager)
                    <tr>
                        <td class="fw-bold">{{ $manager['manager']['name'] ?? '-' }}</td>
                        <td class="text-center">{{ $manager['total_rentals'] }}</td>
                        <td class="text-center">
                            <span class="badge badge-green">{{ $manager['completed_rentals'] }}</span>
                        </td>
                        <td class="text-center">
                            <span class="badge {{ $manager['cancelled_rentals'] > 0 ? 'badge-red' : 'badge-gray' }}">
                                {{ $manager['cancelled_rentals'] }}
                            </span>
                        </td>
                        <td class="text-right fw-bold text-primary">{{ number_format($manager['total_revenue'] ?? 0, 2) }}</td>
                        <td class="text-center">{{ number_format($manager['average_rental_days'] ?? $manager['avg_rental_days'] ?? 0, 1) }}</td>
                        <td class="text-center">
                            @php $rate = $manager['completion_rate'] ?? 0; @endphp
                            <span class="badge {{ $rate >= 80 ? 'badge-green' : ($rate >= 50 ? 'badge-yellow' : 'badge-red') }}">
                                {{ number_format($rate, 1) }}%
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No manager performance data available for the selected period.</p>
    @endif

@endsection
