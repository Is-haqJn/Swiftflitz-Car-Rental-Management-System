@extends('emails.layout')

@php $appName = app(\App\Settings\GeneralSettings::class)->site_name ?: config('app.name'); @endphp

@section('title', 'New Contact Message - ' . $appName)

@section('preheader', 'You have received a new contact message from ' . $submission['first_name'] . ' ' . $submission['last_name'] . '.')

@section('content')
    <h1 style="font-size: 22px; font-weight: 700; color: #1d4ed8; margin-bottom: 6px;">New Contact Message</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        You have received a new message through your website contact form. The sender's details are below.
    </p>

    {{-- Sender Details --}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <tr style="background-color: #f9fafb;">
            <td
                style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 35%;">
                Full Name</td>
            <td
                style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
                {{ $submission['first_name'] }} {{ $submission['last_name'] }}</td>
        </tr>
        <tr>
            <td
                style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                Email</td>
            <td
                style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #111827;">
                <a href="mailto:{{ $submission['email'] }}"
                    style="color: #1d4ed8;">{{ $submission['email'] }}</a>
            </td>
        </tr>
        <tr style="background-color: #f9fafb;">
            <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">Phone Number</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #111827;">
                <a href="tel:{{ $submission['phone'] }}"
                    style="color: #1d4ed8;">{{ $submission['phone'] }}</a>
            </td>
        </tr>
    </table>

    {{-- Message --}}
    <div
        style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <p
            style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
            Message</p>
        <p style="font-size: 14px; color: #0c4a6e; line-height: 1.7; margin: 0; white-space: pre-line;">{{ $submission['message'] }}</p>
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
        You can reply directly to this email to respond to {{ $submission['first_name'] }}.
    </p>
@endsection
