import { useEffect, useRef } from 'react';
import { cn } from '@/shared/libs/utils';
import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

export const HeroSection = ({ className }: { className?: string }) => {
    const { data: res } = useHomepageSettings();
    const s = res?.data;

    const backgroundImage = s?.hero_image_url
        ? `${s.hero_image_url}?v=${s.hero_image_version ?? ''}`
        : undefined;

    const sideText = s?.hero_side_text ?? 'Premium';
    const beginning = s?.hero_title_beginning ?? 'Your';
    const words = s?.hero_title_words ?? ['Choice', 'Car'];
    const highlight = s?.hero_title_highlight ?? 'For';
    const ending = s?.hero_title_ending ?? 'Rent';
    const bgText = s?.hero_background_text ?? 'For Rent';
    const description =
        s?.hero_description ??
        'Swiftflitz is a leading car rental service that offers a wide range of vehicles for rent.';
    const primaryText = s?.hero_cta_text ?? 'Rent A Car';
    const primaryUrl = s?.hero_cta_url ?? '/';
    const secondaryText = s?.hero_secondary_cta_text ?? 'Airport Transfer';
    const secondaryUrl = s?.hero_secondary_cta_url ?? '/';

    const badgeEnabled = s?.hero_featured_vehicle_enabled ?? true;
    const badgeVisibility = s?.hero_featured_vehicle_visibility ?? 'all';
    const badgeName = s?.hero_featured_vehicle_resolved_name ?? null;
    const badgePrice = s?.hero_featured_vehicle_resolved_price ?? null;
    const badgeUrl = s?.hero_featured_vehicle_url ?? '/listings';

    const badgeVisibilityClass =
        badgeVisibility === 'desktop_only'
            ? 'd-none d-md-block'
            : badgeVisibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    // React-managed typewriter - re-runs whenever `words` changes from settings
    const typeSpanRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = typeSpanRef.current;
        if (!el || words.length === 0) {
            return;
        }

        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let timer: ReturnType<typeof setTimeout>;

        const tick = () => {
            const current = words[wordIndex % words.length];

            if (isDeleting) {
                charIndex -= 1;
            } else {
                charIndex += 1;
            }

            el.textContent = current.substring(0, charIndex);

            let delay = 150;

            if (!isDeleting && charIndex === current.length) {
                delay = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex += 1;
                delay = 400;
            }

            timer = setTimeout(tick, delay);
        };

        timer = setTimeout(tick, 500);

        return () => clearTimeout(timer);
    }, [words]);

    return (
        <>
            <div
                className={cn('twm-home2-bnr', className)}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div
                    className="twm-banner-overlay"
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="container">
                        <div className="mask-circle-shape zoom-in-out-element"></div>
                    </div>
                </div>
                <div className="container">
                    <div className="twm-banner-left-content-section">
                        <div className="twm-banner-left-content">
                            {sideText && (
                                <div className="twm-sm-title left">
                                    {sideText}
                                </div>
                            )}
                            <h2 className="twm-banner-title">
                                <em>
                                    {beginning}
                                    <span
                                        ref={typeSpanRef}
                                        className="txt-type"
                                    ></span>
                                </em>
                                <span>{highlight}</span>
                                {ending}
                            </h2>
                            <div className="twm-bnr-discription">
                                {description}
                            </div>
                            <div className="twm-bnr-buttons">
                                <a
                                    href={primaryUrl}
                                    className="site-button btn-large"
                                >
                                    <em>{primaryText}</em>
                                </a>
                                <a
                                    href={secondaryUrl}
                                    className="site-button-secondry btn-large"
                                >
                                    <em>{secondaryText}</em>
                                </a>
                            </div>
                        </div>
                    </div>
                    {badgeEnabled && (badgeName || badgePrice) && (
                        <a
                            href={badgeUrl}
                            className={`twm-banner-product-price${badgeVisibilityClass ? ` ${badgeVisibilityClass}` : ''}`}
                            style={{
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {badgeName && (
                                <div className="twm-product-name">
                                    {badgeName}
                                </div>
                            )}
                            {badgePrice && (
                                <div className="twm-price-section">
                                    <div className="v-price">{badgePrice}</div>
                                    <div className="v-duration">/ Day</div>
                                </div>
                            )}
                        </a>
                    )}
                </div>
                <div className="twm-bnr-lg-text">
                    <span>{bgText}</span>
                </div>
            </div>
        </>
    );
};
