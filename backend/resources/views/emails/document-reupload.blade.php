@extends('emails.layout')

@section('title', 'Action Required: Please Reupload Your Documents')

@section('preheader', 'We need you to reupload your documents to complete your profile verification.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px;">Document Reupload Required</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        Hi {{ $customer->name ?? 'there' }}, we need you to reupload your identity documents so our team can verify your profile before your upcoming rental.
    </p>

    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px;">
        <p style="font-size: 13px; color: #9a3412; margin: 0;">
            Please upload your <strong>driver's license</strong>, <strong>ID document</strong>, and <strong>passport</strong> (if applicable) using the secure link below.
            This link expires in <strong>48 hours</strong>.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $reuploadUrl }}"
           style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none;
                  font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
            Upload My Documents
        </a>
    </div>

    <p style="color: #6b7280; font-size: 13px; text-align: center;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #1d4ed8; word-break: break-all;">{{ $reuploadUrl }}</span>
    </p>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not expect this email, please contact us immediately.
    </p>
@endsection
