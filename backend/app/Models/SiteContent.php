<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SiteContent extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [];

    public static function instance(): static
    {
        if ($model = static::find(1)) {
            return $model;
        }

        $model = new static;
        $model->id = 1;
        $model->save();

        return $model;
    }

    public function mediaPath(): string
    {
        return 'site-content';
    }

    public function mediaCollectionPath(string $collectionName): string
    {
        return match ($collectionName) {
            'hero' => 'site-content/homepage/hero',
            'whychooseus-bg' => 'site-content/homepage/whychooseus',
            'chauffeur' => 'site-content/homepage/chauffeur',
            'icons' => 'site-content/homepage/icons',
            'pickup-process-bg' => 'site-content/homepage/pickupprocess/bg',
            'pickup-process-bottom' => 'site-content/homepage/pickupprocess/bottom',
            'testimonials' => 'site-content/homepage/testimonials',
            'about-banner' => 'site-content/about/banner',
            'about-general-bg' => 'site-content/about/general/bg',
            'about-general-overlay' => 'site-content/about/general/overlay',
            'about-values-bg' => 'site-content/about/values/bg',
            'about-team-photos' => 'site-content/about/team',
            'services-banner' => 'site-content/services/banner',
            'services-facility-cards' => 'site-content/services/cards',
            'services-why-choose-us-bg' => 'site-content/services/whychooseus',
            'faq-banner' => 'site-content/faq/banner',
            'faq-section-bg' => 'site-content/faq/section-bg',
            'contact-banner' => 'site-content/contact/banner',
            'contact-section-bg' => 'site-content/contact/section-bg',
            'listings-banner' => 'site-content/listings/banner',
            'airport-transfer-banner' => 'site-content/airport-transfer/banner',
            'chauffeur-banner' => 'site-content/chauffeur/banner',
            'promo-popup-image' => 'site-content/popups/promo',
            default => "site-content/{$collectionName}",
        };
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('hero')->singleFile();
        $this->addMediaCollection('whychooseus-bg')->singleFile();
        $this->addMediaCollection('chauffeur')->singleFile();
        $this->addMediaCollection('pickup-process-bg')->singleFile();
        $this->addMediaCollection('pickup-process-bottom')->singleFile();
        $this->addMediaCollection('testimonials');
        $this->addMediaCollection('icons');
        $this->addMediaCollection('about-banner')->singleFile();
        $this->addMediaCollection('about-general-bg')->singleFile();
        $this->addMediaCollection('about-general-overlay')->singleFile();
        $this->addMediaCollection('about-values-bg')->singleFile();
        $this->addMediaCollection('about-team-photos');
        $this->addMediaCollection('services-banner')->singleFile();
        $this->addMediaCollection('services-facility-cards');
        $this->addMediaCollection('services-why-choose-us-bg')->singleFile();
        $this->addMediaCollection('faq-banner')->singleFile();
        $this->addMediaCollection('faq-section-bg')->singleFile();
        $this->addMediaCollection('contact-banner')->singleFile();
        $this->addMediaCollection('contact-section-bg')->singleFile();
        $this->addMediaCollection('listings-banner')->singleFile();
        $this->addMediaCollection('airport-transfer-banner')->singleFile();
        $this->addMediaCollection('chauffeur-banner')->singleFile();
        $this->addMediaCollection('promo-popup-image')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('hero-web')
            ->fit(Fit::Max, 1920, 3000)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('hero');

        $this->addMediaConversion('whychooseus-web')
            ->fit(Fit::Max, 1440, 3000)
            ->quality(72)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('whychooseus-bg');

        $this->addMediaConversion('chauffeur-web')
            ->fit(Fit::Max, 900, 3000)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('chauffeur');

        $this->addMediaConversion('pickup-process-bg-web')
            ->fit(Fit::Max, 1440, 3000)
            ->quality(75)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('pickup-process-bg');

        $this->addMediaConversion('pickup-process-bottom-web')
            ->fit(Fit::Max, 900, 3000)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('pickup-process-bottom');

        $this->addMediaConversion('testimonial-web')
            ->fit(Fit::Max, 400, 400)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('testimonials');

        $this->addMediaConversion('about-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('about-banner');

        $this->addMediaConversion('about-general-bg-web')
            ->fit(Fit::Max, 900, 600)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('about-general-bg');

        $this->addMediaConversion('about-general-overlay-web')
            ->fit(Fit::Max, 600, 900)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('about-general-overlay');

        $this->addMediaConversion('about-values-bg-web')
            ->fit(Fit::Max, 1440, 900)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('about-values-bg');

        $this->addMediaConversion('about-team-photo-web')
            ->fit(Fit::Max, 400, 600)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('about-team-photos');

        $this->addMediaConversion('services-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('services-banner');

        $this->addMediaConversion('services-facility-card-web')
            ->fit(Fit::Max, 900, 600)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('services-facility-cards');

        $this->addMediaConversion('services-why-choose-us-bg-web')
            ->fit(Fit::Max, 1440, 3000)
            ->quality(75)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('services-why-choose-us-bg');

        $this->addMediaConversion('faq-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('faq-banner');

        $this->addMediaConversion('faq-section-bg-web')
            ->fit(Fit::Max, 1440, 900)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('faq-section-bg');

        $this->addMediaConversion('contact-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('contact-banner');

        $this->addMediaConversion('contact-section-bg-web')
            ->fit(Fit::Max, 1440, 900)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('contact-section-bg');

        $this->addMediaConversion('listings-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('listings-banner');

        $this->addMediaConversion('airport-transfer-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('airport-transfer-banner');

        $this->addMediaConversion('chauffeur-banner-web')
            ->fit(Fit::Max, 1920, 800)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('chauffeur-banner');

        $this->addMediaConversion('promo-popup-image-web')
            ->fit(Fit::Max, 800, 600)
            ->quality(80)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('promo-popup-image');
    }
}
