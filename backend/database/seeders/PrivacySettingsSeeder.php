<?php

namespace Database\Seeders;

use App\Settings\PrivacySettings;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PrivacySettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $settings = app(PrivacySettings::class);

        if ($settings->content !== '') {
            $this->command->info('Privacy Policy content already set - skipping.');

            return;
        }

        $settings->banner_title = 'Privacy Policy';
        $settings->banner_image_version = 1;
        $settings->content = <<<'HTML'
<h1>Privacy Policy</h1>
<p>Last updated: April 2026</p>
<p>Swiftflitz ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your data when you use our website and services, including self-drive car rentals, chauffeur services, and airport transfers.</p>
<p>By using our services, you agree to the practices described in this policy.</p>

<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly to us and information generated through your use of our services:</p>
<ul>
<li><strong>Personal Identification:</strong> Full name, email address, phone number, and residential address</li>
<li><strong>Identity &amp; Driving Documents:</strong> National ID, driver's licence, passport (where required for self-drive rentals)</li>
<li><strong>Payment Information:</strong> Transaction details processed securely through our payment providers. We do not store full card numbers.</li>
<li><strong>Booking Details:</strong> Rental dates, vehicle selected, pick-up and drop-off locations, and service type</li>
<li><strong>Communications:</strong> Messages, enquiries, and feedback you send us</li>
<li><strong>Technical Data:</strong> IP address, browser type, device information, and pages visited on our website</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
<li>Process and manage your bookings and payments</li>
<li>Verify your identity and driving eligibility for self-drive rentals</li>
<li>Coordinate chauffeur assignments and airport transfer schedules</li>
<li>Communicate booking confirmations, updates, and service notifications</li>
<li>Respond to enquiries and provide customer support</li>
<li>Improve our website, services, and user experience</li>
<li>Comply with legal obligations, including those related to vehicle rental agreements</li>
<li>Send promotional offers and updates, where you have consented</li>
</ul>

<h2>3. How We Share Your Information</h2>
<p>We do not sell your personal information. We may share it with:</p>
<ul>
<li><strong>Service Partners:</strong> Chauffeurs and drivers assigned to your booking, on a need-to-know basis</li>
<li><strong>Payment Processors:</strong> Secure third-party providers who handle transaction processing</li>
<li><strong>Legal Authorities:</strong> Where required by law, court order, or regulatory requirement</li>
<li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction</li>
</ul>
<p>All third parties we work with are required to handle your data in accordance with applicable data protection laws.</p>

<h2>4. Data Retention</h2>
<p>We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy, including maintaining booking records, resolving disputes, and meeting legal obligations. Typically, booking records are retained for a minimum of five (5) years. You may request deletion of your data subject to these retention requirements.</p>

<h2>5. Your Rights</h2>
<p>Depending on your location, you may have the following rights regarding your personal data:</p>
<ul>
<li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
<li><strong>Correction:</strong> Request corrections to inaccurate or incomplete information</li>
<li><strong>Deletion:</strong> Request deletion of your data, subject to legal retention requirements</li>
<li><strong>Objection:</strong> Object to certain uses of your data, including direct marketing</li>
<li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
</ul>
<p>To exercise any of these rights, please contact us at <strong>info@swiftflitz.com</strong>.</p>

<h2>6. Data Security</h2>
<p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, disclosure, or misuse. These include secure HTTPS connections, access controls, and encrypted payment processing. However, no method of transmission over the internet is entirely secure, and we cannot guarantee absolute security.</p>

<h2>7. Cookies</h2>
<p>Our website uses cookies and similar technologies to enhance your browsing experience, analyse site traffic, and personalise content. You may control cookie preferences through your browser settings. Disabling cookies may affect the functionality of certain features on our website.</p>

<h2>8. Third-Party Links</h2>
<p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any external sites you visit.</p>

<h2>9. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last updated" date. We encourage you to review this policy periodically. Continued use of our services after changes are posted constitutes your acceptance of the updated policy.</p>

<h2>10. Contact Us</h2>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
<ul>
<li><strong>Email:</strong> info@swiftflitz.com</li>
<li><strong>Phone:</strong> +233 XX XXX XXXX</li>
<li><strong>Address:</strong> Accra, Ghana</li>
</ul>
HTML;

        $settings->save();

        $this->command->info('Privacy Policy content seeded successfully.');
    }
}
