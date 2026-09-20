<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Seed the four transactional email templates.
     */
    public function run(): void
    {
        $templates = [
            [
                'key' => 'booking_confirmation',
                'name' => 'Booking Confirmation',
                'description' => 'Sent to the customer when their rental booking is confirmed.',
                'subject' => 'Booking Confirmed – {{booking_reference}}',
                'default_subject' => 'Booking Confirmed – {{booking_reference}}',
                'html_content' => null,
                'default_html' => $this->bookingConfirmationHtml(),
            ],
            [
                'key' => 'return_reminder',
                'name' => 'Return Reminder',
                'description' => 'Sent to the customer as a reminder before their vehicle return date.',
                'subject' => 'Reminder: Return {{vehicle_name}} by {{return_date}}',
                'default_subject' => 'Reminder: Return {{vehicle_name}} by {{return_date}}',
                'html_content' => null,
                'default_html' => $this->returnReminderHtml(),
            ],
            [
                'key' => 'overdue_alert',
                'name' => 'Overdue Alert',
                'description' => 'Sent when a rental is past its return date.',
                'subject' => 'OVERDUE: {{vehicle_name}} – {{days_overdue}} day(s) late',
                'default_subject' => 'OVERDUE: {{vehicle_name}} – {{days_overdue}} day(s) late',
                'html_content' => null,
                'default_html' => $this->overdueAlertHtml(),
            ],
            [
                'key' => 'quote_confirmation',
                'name' => 'Quote Confirmation',
                'description' => 'Sent to the customer when a quote request is received.',
                'subject' => 'Your Quote Request – {{quote_reference}}',
                'default_subject' => 'Your Quote Request – {{quote_reference}}',
                'html_content' => null,
                'default_html' => $this->quoteConfirmationHtml(),
            ],
            [
                'key' => 'pickup_reminder',
                'name' => 'Pickup Reminder',
                'description' => 'Sent to remind the customer of their upcoming vehicle pickup.',
                'subject' => 'Reminder: Your vehicle pickup on {{pickup_date}}',
                'default_subject' => 'Reminder: Your vehicle pickup on {{pickup_date}}',
                'html_content' => null,
                'default_html' => $this->pickupReminderHtml(),
            ],
            [
                'key' => 'vehicle_expiry',
                'name' => 'Vehicle Expiry Notification',
                'description' => 'Sent to admin users when a vehicle document is expiring soon.',
                'subject' => 'Vehicle Document Expiring: {{vehicle_name}}',
                'default_subject' => 'Vehicle Document Expiring: {{vehicle_name}}',
                'html_content' => null,
                'default_html' => $this->vehicleExpiryHtml(),
            ],
            [
                'key' => 'new_quote_request',
                'name' => 'New Quote Request (Admin)',
                'description' => 'Sent to admin/manager users when a new quote request is submitted by a customer.',
                'subject' => 'New Quote Request – {{quote_reference}}',
                'default_subject' => 'New Quote Request – {{quote_reference}}',
                'html_content' => null,
                'default_html' => $this->newQuoteRequestHtml(),
            ],
            [
                'key' => 'quote_ready',
                'name' => 'Quote Ready',
                'description' => 'Sent to the customer when their quote has been prepared and is ready for review.',
                'subject' => 'Your Quote is Ready – {{quote_reference}}',
                'default_subject' => 'Your Quote is Ready – {{quote_reference}}',
                'html_content' => null,
                'default_html' => $this->quoteReadyHtml(),
            ],
            [
                'key' => 'password_reset',
                'name' => 'Password Reset',
                'description' => 'Sent to the user when they request a password reset link.',
                'subject' => 'Reset Your Password – {{app_name}}',
                'default_subject' => 'Reset Your Password – {{app_name}}',
                'html_content' => null,
                'default_html' => $this->passwordResetHtml(),
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::query()->updateOrCreate(
                ['key' => $template['key']],
                $template
            );
        }
    }

    private function baseLayout(string $title, string $body, string $footerNote = ''): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <!-- Header -->
      <tr><td style="background:#1d4ed8;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
        <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">{{app_name}}</span>
        <p style="color:#bfdbfe;font-size:13px;margin-top:4px;">Vehicle Rental Management</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#fff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        {$body}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin-bottom:6px;">{$footerNote}</p>
        <p style="font-size:12px;color:#9ca3af;">&copy; {{year}} {{app_name}}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
    }

    private function bookingConfirmationHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Booking Confirmed</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, your booking is confirmed.</p>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:28px;text-align:center;">
  <p style="font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Booking Reference</p>
  <p style="font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:2px;">{{booking_reference}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Pickup Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{pickup_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Return Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{return_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Duration</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{duration}} days</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Total Cost</td><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#1d4ed8;">{{currency_symbol}}{{total_cost}}</td></tr>
</table>
<div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:4px;">Important</p>
  <p style="font-size:13px;color:#78350f;line-height:1.5;">Please bring a valid ID and your driver's licence on pickup day.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">Questions? Contact us at <a href="mailto:{{support_email}}" style="color:#1d4ed8;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Booking Confirmation', $body, 'This email was sent by {{app_name}}.');
    }

    private function returnReminderHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Return Reminder</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, this is a friendly reminder that your vehicle is due back soon.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Booking Reference</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{booking_reference}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Return Date</td><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#d97706;">{{return_date}}<span style="display:block;font-size:13px;font-weight:600;color:#9a3412;margin-top:2px;">{{return_time}}</span></td></tr>
</table>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#92400e;line-height:1.5;">Please ensure the vehicle is returned on time to avoid any additional charges. Contact us if you need an extension.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color:#1d4ed8;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Return Reminder', $body, 'This email was sent by {{app_name}}.');
    }

    private function overdueAlertHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#dc2626;margin-bottom:6px;">Vehicle Overdue</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, your rental is overdue. Please return the vehicle immediately.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Was Due</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#dc2626;border-bottom:1px solid #e5e7eb;">{{return_date}}<span style="display:block;font-size:12px;font-weight:600;color:#b91c1c;margin-top:2px;">{{return_time}}</span></td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Days Overdue</td><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#dc2626;">{{days_overdue}} day(s)</td></tr>
</table>
<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#991b1b;font-weight:600;margin-bottom:4px;">Immediate Action Required</p>
  <p style="font-size:13px;color:#7f1d1d;line-height:1.5;">Late return fees may apply for each additional day. Please return the vehicle or contact us immediately to discuss your situation.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">Contact us urgently at <a href="mailto:{{support_email}}" style="color:#dc2626;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Overdue Alert', $body, 'This email was sent by {{app_name}}.');
    }

    private function quoteConfirmationHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Quote Received</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, we've received your rental quote request.</p>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:28px;text-align:center;">
  <p style="font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Quote Reference</p>
  <p style="font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:2px;">{{quote_reference}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Pickup Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{pickup_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Return Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{return_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Duration</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">{{rental_days}} day(s)</td></tr>
</table>
<p style="font-size:14px;color:#374151;margin-bottom:28px;line-height:1.7;">Our team will review your request and get back to you with a detailed quote shortly. Please keep your reference number handy for follow-ups.</p>
<p style="font-size:13px;color:#6b7280;text-align:center;">Questions? Contact us at <a href="mailto:{{support_email}}" style="color:#1d4ed8;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Quote Confirmation', $body, 'This email was sent by {{app_name}}.');
    }

    private function newQuoteRequestHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">New Quote Request</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{recipient_name}}, a new quote request has been submitted and requires your attention.</p>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:28px;text-align:center;">
  <p style="font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Quote Reference</p>
  <p style="font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:2px;">{{quote_reference}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Customer</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{customer_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{customer_email}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Phone</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{customer_phone}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Rental Duration</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{rental_days}} day(s)</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Message</td><td style="padding:12px 16px;font-size:13px;color:#374151;">{{message}}</td></tr>
</table>
<p style="font-size:13px;color:#6b7280;text-align:center;">Log in to the admin panel to review and respond to this quote request.</p>
BODY;

        return $this->baseLayout('New Quote Request', $body, 'This is an automated notification from {{app_name}}.');
    }

    private function pickupReminderHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Pickup Reminder</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, this is a reminder that your vehicle pickup is scheduled soon.</p>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:28px;text-align:center;">
  <p style="font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Booking Reference</p>
  <p style="font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:2px;">{{booking_reference}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Pickup Date</td><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#059669;">{{pickup_date}}<span style="display:block;font-size:13px;font-weight:600;color:#047857;margin-top:2px;">{{pickup_time}}</span></td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Return Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">{{return_date}}<span style="display:block;font-size:12px;font-weight:400;color:#6b7280;margin-top:2px;">{{return_time}}</span></td></tr>
</table>
<div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:4px;">Please Remember</p>
  <p style="font-size:13px;color:#78350f;line-height:1.5;">Bring your valid ID and driver's licence. Arrive on time to complete the pickup process smoothly.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">Questions? Contact us at <a href="mailto:{{support_email}}" style="color:#1d4ed8;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Pickup Reminder', $body, 'This email was sent by {{app_name}}.');
    }

    private function quoteReadyHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Your Quote is Ready</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, great news! Your rental quote has been prepared and is ready for your review.</p>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:28px;text-align:center;">
  <p style="font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Quote Reference</p>
  <p style="font-size:28px;font-weight:800;color:#1d4ed8;letter-spacing:2px;">{{quote_reference}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Pickup Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{pickup_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Return Date</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{return_date}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Duration</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{rental_days}} day(s)</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Rental Cost</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{base_cost}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Security Deposit</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">{{deposit_amount}}</td></tr>
</table>
<p style="font-size:14px;color:#374151;margin-bottom:8px;">This quote is valid until <strong>{{expires_at}}</strong>. Please confirm or decline before it expires.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
  <tr>
    <td align="center" style="padding:0 8px 0 0;">
      <a href="{{confirm_url}}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Confirm Quote</a>
    </td>
    <td align="center" style="padding:0 0 0 8px;">
      <a href="{{cancel_url}}" style="display:inline-block;background:#fff;color:#6b7280;font-weight:600;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none;border:1px solid #d1d5db;">Decline</a>
    </td>
  </tr>
</table>
<p style="font-size:13px;color:#6b7280;text-align:center;">Questions? Contact us at <a href="mailto:{{support_email}}" style="color:#1d4ed8;font-weight:600;">{{support_email}}</a></p>
BODY;

        return $this->baseLayout('Your Quote is Ready', $body, 'This email was sent by {{app_name}}.');
    }

    private function passwordResetHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">Reset Your Password</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">Hi {{customer_name}}, we received a request to reset the password for your account.</p>
<div style="text-align:center;margin-bottom:28px;">
  <a href="{{reset_url}}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">Reset Password</a>
</div>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#92400e;line-height:1.5;">This link will expire in <strong>{{expire_minutes}} minutes</strong>. If you did not request a password reset, no action is required.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">If the button above does not work, copy and paste this URL into your browser:<br><a href="{{reset_url}}" style="color:#1d4ed8;word-break:break-all;">{{reset_url}}</a></p>
BODY;

        return $this->baseLayout('Password Reset', $body, 'If you did not request this, please ignore this email.');
    }

    private function vehicleExpiryHtml(): string
    {
        $body = <<<'BODY'
<h1 style="font-size:22px;font-weight:700;color:#d97706;margin-bottom:6px;">Vehicle Document Expiring</h1>
<p style="color:#6b7280;font-size:14px;margin-bottom:28px;">This is an automated notification that a vehicle document is expiring soon.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Vehicle</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{vehicle_name}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">License Plate</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">{{license_plate}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Document Type</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#d97706;border-bottom:1px solid #e5e7eb;">{{document_type}}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Expiry Date</td><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#d97706;">{{expiry_date}}</td></tr>
</table>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:28px;">
  <p style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:4px;">Action Required</p>
  <p style="font-size:13px;color:#78350f;line-height:1.5;">Please renew this document before it expires to ensure the vehicle remains compliant and available for rental.</p>
</div>
<p style="font-size:13px;color:#6b7280;text-align:center;">This is an automated notification from {{app_name}}.</p>
BODY;

        return $this->baseLayout('Vehicle Document Expiring', $body, 'This is an automated notification.');
    }
}
