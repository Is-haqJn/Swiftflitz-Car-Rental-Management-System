<?php

namespace App\Mail;

use App\DTOs\PricingBreakdownData;
use App\Models\QuoteRequest;
use App\Services\Contracts\PricingServiceInterface;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Throwable;

class QuoteReadyMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly QuoteRequest $quoteRequest) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Quote is Ready - {$this->quoteRequest->reference}",
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $token = $this->quoteRequest->quote_token ?? '';
        $confirmUrl = "{$frontendUrl}/confirm-quote/{$token}";
        $cancelUrl = "{$frontendUrl}/confirm-quote/{$token}?cancel=1";

        $pricing = $this->resolvePricing();

        $vehicle = $this->quoteRequest->vehicle;
        $currencySymbol = $vehicle?->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵');

        return new Content(
            view: 'emails.quote-ready',
            with: [
                'confirmUrl' => $confirmUrl,
                'cancelUrl' => $cancelUrl,
                'expiresAt' => $this->quoteRequest->token_expires_at,
                'pricing' => $pricing,
                'currency_symbol' => $currencySymbol,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }

    /**
     * Calculate the full pricing breakdown using PricingService so the email
     * reflects admin_base_price overrides, addons, location fees, VAT, etc.
     */
    private function resolvePricing(): ?PricingBreakdownData
    {
        $vehicle = $this->quoteRequest->vehicle;

        if (! $vehicle || ! $this->quoteRequest->pickup_date || ! $this->quoteRequest->return_date) {
            return null;
        }

        try {
            /** @var PricingServiceInterface $pricingService */
            $pricingService = app(PricingServiceInterface::class);

            $addons = collect($this->quoteRequest->requested_addon_ids ?? [])
                ->map(fn ($id) => ['id' => $id, 'quantity' => 1])
                ->all();

            $overrideBaseCost = null;
            if ($this->quoteRequest->admin_base_price !== null) {
                $rentalDays = $pricingService->getRentalDays(
                    $this->quoteRequest->pickup_date->format('Y-m-d'),
                    $this->quoteRequest->return_date->format('Y-m-d')
                );
                $overrideBaseCost = round((float) $this->quoteRequest->admin_base_price * $rentalDays, 2);
            }

            return $pricingService->calculate(
                vehicle: $vehicle,
                pickupDate: $this->quoteRequest->pickup_date->format('Y-m-d'),
                returnDate: $this->quoteRequest->return_date->format('Y-m-d'),
                addons: $addons,
                pickupLocationId: $this->quoteRequest->pickup_location_id,
                overrideBaseCost: $overrideBaseCost,
            );
        } catch (Throwable) {
            return null;
        }
    }
}
