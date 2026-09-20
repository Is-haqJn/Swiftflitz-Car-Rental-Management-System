@extends('emails.layout')

@section('title', 'New Customer Profile Submitted')

@section('preheader', 'A new customer has submitted their profile details for review.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">New Profile Submitted for Review</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
        A new customer has completed their profile form. Please review their details and verify their account.
    </p>

    {{-- Customer details table --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
        <tr>
            <td colspan="2" style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                Customer Details
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 10px 0 4px; width: 35%;">Name</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 10px 0 4px;">{{ $customerName }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Email</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $customerEmail }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Phone</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $customerPhone }}</td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Booking Reference</td>
            <td style="font-size: 13px; color: #111827; font-weight: 600; padding: 4px 0;">{{ $rentalReference }}</td>
        </tr>
    </table>

    {{-- CTA --}}
    <div style="text-align: center; margin-bottom: 24px;">
        <a href="{{ $adminUrl }}"
           style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
            Review Customer Profile &rarr;
        </a>
    </div>

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
        Log in to the admin panel to verify their documents and update their profile status.
    </p>
@endsection
