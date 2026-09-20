<?php

namespace Database\Seeders;

use App\Settings\TermsSettings;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TermsSettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $settings = app(TermsSettings::class);

        $settings->banner_title = 'Terms & Conditions';
        $settings->banner_image_version = 1;
        $settings->content = <<<'HTML'
<h1>Rental Agreement &amp; Terms of Service</h1>
<p>By proceeding with a booking, you confirm that you have read, understood, and agreed to these Terms of Service in full.</p>

<h2>1. General Terms (All Services)</h2>

<h3>1.1 Vehicle Inspection</h3>
<p>Clients are advised to conduct a thorough inspection of the vehicle at the time of pickup. Check engine oil, water, brake fluid, and other transmission fluids. Always take personal videos and pictures of the vehicle during both pickup and drop-off for reference, and complete a joint inspection with the handover agent.</p>

<h3>1.2 Security Deposit</h3>
<p>A refundable security deposit is required for all rentals. Deposits are refunded within 12–24 hours of vehicle drop-off once all conditions of this agreement are met. In rare cases involving network issues, refunds may extend up to 48 hours. Contact your rental agent if this occurs.</p>

<h3>1.3 Vehicle Condition on Return</h3>
<p>The vehicle must be returned in the same condition as received. Any scratch, damage, fuel shortage, or uncleaned state will be charged to the client and the security deposit withheld until the matter is resolved.</p>

<h3>1.4 Restricted Use</h3>
<ul>
<li>The vehicle must not be used to transport contraband or conduct any illegal activity.</li>
<li>Clients must not drive under the influence of alcohol or unsafe drugs.</li>
<li>All road safety regulations must be observed at all times. Defensive driving is strongly encouraged.</li>
</ul>

<h3>1.5 Accidents &amp; Damage</h3>
<p>If you are involved in an accident while the vehicle is under your care, contact us immediately before taking any action or authorising any repairs. Any repairs done without our prior approval will result in a surcharge on top of the original repair cost.</p>

<h3>1.6 Debt Recovery</h3>
<p>When unpaid rental charges, damages, or costs arise, Swiftflitz reserves the right to use any non-physical means to recover the owed amount, including taking possession of a collateral or valued item worth the amount owed. The item will be returned only after the debt is fully cleared.</p>

<h2>2. Self-Drive Car Rentals</h2>

<h3>2.1 Authorised Driver</h3>
<p>Only the renter named in this agreement is authorised to drive the vehicle. The vehicle must not be handed over to any other person. The named renter bears full liability for any incident.</p>

<h3>2.2 Location of Use</h3>
<p>The vehicle must not be taken outside the agreed location of use as stated in the booking agreement.</p>

<h3>2.3 Breach of Contract</h3>
<p>Taking the vehicle outside the agreed jurisdiction is considered a breach of contract and will attract a penalty fee plus outside-jurisdiction charges. The penalty fee is determined by Swiftflitz based on the vehicle's location at the time of discovery.</p>

<h3>2.4 Rental Hours &amp; Return Policy</h3>
<p>Rental hours begin when the vehicle is picked up or dispatched. We do not operate a 24-hour rental cycle. On the final day of the rental, the vehicle must be returned between 20:00 and 22:00 hours. Vehicles not returned by 22:00 will attract an additional charge of GHS 100 per hour for every hour of delay.</p>

<h3>2.5 Extension of Rental</h3>
<p>If you wish to extend your rental, a maximum of 24 hours is given to make payment to confirm the extension. If payment is not received within 24 hours, the vehicle engine will be remotely stopped and all charges arising from vehicle retrieval will be borne by the client.</p>

<h3>2.6 No Insurance Cover</h3>
<p>This rental agreement carries no insurance cover. The client is 100% liable for all external damages, theft, loss, or stolen parts of the rental vehicle. Exercise caution at all times.</p>

<h2>3. Chauffeur Services</h2>

<h3>3.1 Service Duration</h3>
<p>Chauffeur rentals operate on a 12-hour service window. Any usage beyond 12 hours is considered overtime and will be charged at {{chauffeur_overtime_rate}} per additional hour.</p>

<h3>3.2 Driver Conduct</h3>
<p>Our chauffeurs are professional drivers. Clients are expected to treat drivers with respect. Any form of harassment or request to engage in illegal activity will result in immediate termination of the service with no refund.</p>

<h3>3.3 Waiting Time</h3>
<p>Clients are expected to be ready at the agreed pickup time. Waiting time beyond the grace period may be charged at the applicable rate.</p>

<h3>3.4 Cancellation</h3>
<p>Cancellations for chauffeur bookings are subject to the Cancellation &amp; Refund Policy outlined in Section 5 of this agreement.</p>

<h2>4. Airport Transfer Services</h2>

<h3>4.1 Package-Based Pricing</h3>
<p>Airport transfer services are priced based on pre-defined packages. The package selected at the time of booking determines the scope of the service, including vehicle type and inclusions.</p>

<h3>4.2 Flight Monitoring</h3>
<p>We monitor your flight for delays. If your inbound flight is delayed, we will adjust pickup accordingly at no extra charge, subject to driver availability.</p>

<h3>4.3 No-Show Policy</h3>
<p>If a client fails to make contact or appear within the no-show grace period after the scheduled pickup time, the booking will be marked as a no-show and no refund will be issued.</p>

<h3>4.4 Cancellation</h3>
<p>Cancellations for airport transfer bookings are subject to the Cancellation &amp; Refund Policy outlined in Section 5 of this agreement.</p>

<h2>5. Cancellation &amp; Refund Policy</h2>

<h3>5.1 Free Cancellation Window</h3>
<p>Cancellations made outside the free cancellation window (as communicated at the time of booking) will not attract any cancellation fee.</p>

<h3>5.2 Late Cancellation</h3>
<p>Cancellations made within the free cancellation window will attract a cancellation fee as stated at the time of booking.</p>

<h3>5.3 Active Rental / Post-Pickup Cancellation</h3>
<p>If a vehicle has been processed, booked, and handed over to the client, a cancellation request will only be honoured if the vehicle has experienced a mechanical breakdown rendering it immobile. In such cases, a refund will be issued for the remaining days only. No refund will be issued for insignificant issues such as the malfunction of non-essential sensors.</p>

<h3>5.4 Vehicle Breakdown</h3>
<p>If your vehicle breaks down mechanically through no fault of your own, contact us immediately. We will dispatch a mechanic or coordinate with one near your location. If the repair will take longer than 24 hours, we will arrange a temporary replacement. If no replacement is available, a refund will be issued for the remaining rental days.</p>

<h3>5.5 Booking Modifications</h3>
<p>Modifications to a booking are subject to a modification fee if requested after the free modification window has passed. The applicable fee will be communicated at the time of booking.</p>
HTML;

        $settings->save();

        $this->command->info('Terms & Conditions content seeded successfully.');
    }
}
