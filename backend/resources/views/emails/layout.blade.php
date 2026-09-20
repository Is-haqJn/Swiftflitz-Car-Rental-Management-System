<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    @php $appName = app(\App\Settings\GeneralSettings::class)->site_name ?: config('app.name'); @endphp
    <title>@yield('title', $appName)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f5f7;
            color: #1f2937;
            line-height: 1.6;
        }

        a {
            color: #1d4ed8;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    </style>
    <style type="text/css">
        /* Mobile responsive styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .email-body-cell {
                padding: 20px 16px !important;
            }
            .stack-column {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-full-width {
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .mobile-hide {
                display: none !important;
            }
            .mobile-font-sm {
                font-size: 14px !important;
                line-height: 1.5 !important;
            }
            img {
                max-width: 100% !important;
                height: auto !important;
            }
            .btn-cta {
                width: 100% !important;
                text-align: center !important;
                box-sizing: border-box !important;
            }
        }
    </style>
</head>

<body style="background-color: #f4f5f7; margin: 0; padding: 0;">

    {{-- Preheader text (hidden in email body, shows in inbox preview) --}}
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        @yield('preheader')
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px;">

                    {{-- Header --}}
                    <tr>
                        <td
                            style="background-color: #1d4ed8; border-radius: 8px 8px 0 0; padding: 32px 40px; text-align: center;">
                            <a href="{{ config('app.url') }}" style="text-decoration: none;">
                                @php
                                $settings = app(\App\Settings\GeneralSettings::class);
                                $logoUrl = $settings->logo_url ?? null;
                                $appName = $settings->site_name ?: config('app.name');
                            @endphp
                                @if ($logoUrl)
                                    <img src="{{ $logoUrl }}" alt="{{ $appName }}"
                                        style="max-height: 48px; max-width: 200px;">
                                @else
                                    <span
                                        style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">{{ $appName }}</span>
                                @endif
                            </a>
                            <p style="color: #bfdbfe; font-size: 13px; margin-top: 4px; letter-spacing: 0.5px;">Vehicle
                                Rental Management</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td class="email-body-cell"
                            style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td
                            style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px 40px; text-align: center;">
                            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
                                This email was sent by {{ $appName }}.
                            </p>
                            <p style="font-size: 12px; color: #9ca3af;">
                                &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>

</html>
