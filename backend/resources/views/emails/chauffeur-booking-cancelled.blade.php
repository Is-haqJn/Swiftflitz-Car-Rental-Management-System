@extends('emails.layout')

@section('title', 'Chauffeur Booking Cancelled')

@section('preheader', 'Your chauffeur booking has been cancelled.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Booking Cancelled</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, your chauffeur booking has been cancelled.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; color: #dc2626; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #dc2626; margin: 0; letter-spacing: 1px;">{{ $reference }}</p>
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6; margin-bottom: 0;">
        If you believe this is an error or would like to make a new booking, please contact us.
    </p>
@endsection
