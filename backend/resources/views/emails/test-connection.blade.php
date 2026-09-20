@php $appName = app(\App\Settings\GeneralSettings::class)->site_name ?: config('app.name'); @endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;font-family:sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
        <td style="background:#1e40af;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:20px;">SMTP Connection Test</h1>
        </td>
    </tr>
    <tr>
        <td style="padding:32px;">
            <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                ✅ Your SMTP configuration is working correctly.
            </p>
            <p style="font-size:14px;color:#6b7280;margin:0;">
                This test email was sent from {{ $appName }} to verify your mail server settings.
                No action is required.
            </p>
        </td>
    </tr>
    <tr>
        <td style="padding:16px 32px;background:#f9fafb;text-align:center;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">{{ $appName }} Car Rental Management</p>
        </td>
    </tr>
</table>
</body>
</html>
