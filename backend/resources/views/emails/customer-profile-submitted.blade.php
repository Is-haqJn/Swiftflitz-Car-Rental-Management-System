@extends('emails.layout')

@section('title', 'Profile Received')

@section('preheader', 'We\'ve received your profile details - your rental is being finalised.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Profile Details Received!</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
        Hi {{ $customerName }}, thank you for submitting your details. Our team will review them shortly.
    </p>

    {{-- Reference badge --}}
    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Booking Reference</p>
        <p style="font-size: 22px; font-weight: 700; color: #15803d; margin: 0; letter-spacing: 1px;">{{ $rentalReference }}</p>
    </div>

    {{-- What happens next --}}
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
        <p style="font-size: 13px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">&#10003; What happens next?</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e3a8a; line-height: 2;">
            <li>Our team will verify your submitted documents.</li>
            <li>You'll be contacted if any additional information is needed.</li>
            <li>Your vehicle will be ready for pickup on your scheduled date.</li>
        </ul>
    </div>

    <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        If you have any questions, please don't hesitate to contact us. Keep your booking reference handy - you'll need it when you arrive for pickup.
    </p>
@endsection
