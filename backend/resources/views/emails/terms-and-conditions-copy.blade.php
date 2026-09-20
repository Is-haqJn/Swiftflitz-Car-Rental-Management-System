@extends('emails.layout')

@section('title', 'Terms and Conditions - ' . $appName)

@section('preheader', 'Your copy of the Terms and Conditions from ' . $appName . ' is attached.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Terms and Conditions</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 28px;">
        Thank you for booking with {{ $appName }}. Your copy of our Terms and Conditions is attached to this email as a PDF for your records.
    </p>

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px;">
        <p style="font-size: 13px; color: #374151; margin: 0;">
            Please review the attached document carefully. By completing your booking, you have agreed to these terms.
            If you have any questions, please contact us.
        </p>
    </div>

    @if(!empty($paymentUrl))
        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 6px 6px 0; padding: 14px 16px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #9a3412; font-weight: 600; margin-bottom: 4px;">Payment Required</p>
            <p style="font-size: 13px; color: #7c2d12; line-height: 1.5; margin: 0;">Your booking is reserved but not confirmed until payment is received.</p>
        </div>
        <div style="text-align: center; margin-bottom: 16px;">
            <a href="{{ $paymentUrl }}"
                style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
                Pay Now
            </a>
        </div>
        <div style="background-color: #f8faff; border: 1px dashed #bfdbfe; border-radius: 6px; padding: 12px 16px; margin-bottom: 28px; text-align: center;">
            <p style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">Button not working? Copy and paste this link into your browser:</p>
            <a href="{{ $paymentUrl }}" style="font-size: 11px; color: #1d4ed8; word-break: break-all; text-decoration: underline;">{{ $paymentUrl }}</a>
        </div>
    @endif
@endsection
