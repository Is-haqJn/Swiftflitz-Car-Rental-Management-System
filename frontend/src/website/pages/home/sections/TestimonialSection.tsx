import { useEffect, useRef } from 'react';
import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';

const AVATAR_PALETTE = [
    '#4A90D9',
    '#E67E22',
    '#27AE60',
    '#8E44AD',
    '#E74C3C',
    '#16A085',
    '#F39C12',
    '#C0392B',
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

declare global {
    interface Window {
        jQuery?: any;
    }
}

const DEFAULT_CARDS = [
    {
        image_url: 'assets/images/testimonial/pic1.jpg',
        name: 'Kevin Martin',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
    {
        image_url: 'assets/images/testimonial/pic2.jpg',
        name: 'Devid Cullen',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
    {
        image_url: 'assets/images/testimonial/pic3.jpg',
        name: 'Piter Has',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
];

export const TestimonialSection = () => {
    const { data: settingsRes, isLoading } = useHomepageSettings();
    const s = settingsRes?.data;
    const carouselRef = useRef<HTMLDivElement>(null);

    const show = s?.show_testimonial_section ?? true;
    const visibility = s?.testimonial_visibility ?? 'all';
    const visibilityClass =
        visibility === 'desktop_only'
            ? 'd-none d-md-block'
            : visibility === 'mobile_only'
              ? 'd-md-none'
              : '';

    const title = s?.testimonial_title ?? 'Testimonial';
    const largeTitle = s?.testimonial_large_title ?? 'What Our Customers Say';
    const showImages = s?.testimonial_show_images ?? true;
    const showRatings = s?.testimonial_show_ratings ?? true;
    const cards = s?.testimonial_cards?.length
        ? s.testimonial_cards
        : DEFAULT_CARDS;

    // Initialise (or re-initialise) OWL Carousel after React has committed
    // the testimonial cards to the DOM. We own the carousel element via
    // carouselRef so OWL never gets a chance to initialise on React-managed
    // nodes before data is ready - eliminating the OWL/React DOM conflict.
    useEffect(() => {
        if (isLoading) return;
        if (!window.jQuery || !carouselRef.current) return;

        const $ = window.jQuery;
        const $el = $(carouselRef.current);

        if ($el.data('owlCarousel')) $el.owlCarousel('destroy');

        $el.owlCarousel({
            loop: cards.length > 3,
            autoplay: true,
            margin: 30,
            autoplayTimeout: 3000,
            nav: true,
            dots: false,
            navText: [
                '<i class="feather feather-chevron-left"></i>',
                '<i class="feather feather-chevron-right"></i>',
            ],
            responsive: {
                0: { items: 1 },
                768: { items: 2 },
                1200: { items: 3 },
            },
        });
    }, [isLoading, cards]);

    if (!show) return null;

    return (
        <>
            <div
                className={`section-full p-t150 site-bg-white twm-testimonial-section-wrap wow fadeInDown${visibilityClass ? ` ${visibilityClass}` : ''}`}
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 col-md-12">
                            {/* <!-- TITLE START--> */}
                            <div className="section-head left ">
                                <div className="twm-sm-title left">{title}</div>
                                <h2 className="twm-large-title site-text-dark">
                                    {largeTitle}
                                </h2>
                            </div>
                            {/* <!-- TITLE END--> */}
                        </div>
                    </div>

                    <div className="section-content">
                        {isLoading ? (
                            // Plain row skeleton - no carousel classes, so
                            // useCustomScripts never initialises OWL on these
                            // nodes before data is ready.
                            <div className="row m-b30">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="col-lg-4 col-md-6 m-b30"
                                    >
                                        <div
                                            className="twm-testimonial2"
                                            style={{
                                                minHeight: 180,
                                                background: '#f5f5f5',
                                                borderRadius: 8,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // ref-controlled carousel - OWL is initialised by
                            // our useEffect only after settings are in the DOM.
                            <div
                                ref={carouselRef}
                                className="owl-carousel twm-blog-carousel next-prev-top-right"
                            >
                                {cards.map((card, index) => (
                                    <div key={index} className="item">
                                        <div className="twm-testimonial2">
                                            <div className="twm-testimonial-head">
                                                <div className="media-pic">
                                                    {showImages &&
                                                    card.image_url ? (
                                                        <img
                                                            src={card.image_url}
                                                            alt={card.name}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: 100,
                                                                height: 100,
                                                                background:
                                                                    AVATAR_PALETTE[
                                                                        index %
                                                                            AVATAR_PALETTE.length
                                                                    ],
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                fontSize:
                                                                    '2rem',
                                                                letterSpacing:
                                                                    '0.05em',
                                                            }}
                                                        >
                                                            {getInitials(
                                                                card.name
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="twm-author-detail">
                                                    <h3 className="twm-title">
                                                        {card.name}
                                                    </h3>
                                                    {card.position && (
                                                        <div className="twm-position">
                                                            {card.position}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="twm-testimonial-detail">
                                                <p>{card.details}</p>
                                                {showRatings &&
                                                    card.rating != null && (
                                                        <div className="twm-rating-wrap">
                                                            {Array.from({
                                                                length: card.rating,
                                                            }).map((_, i) => (
                                                                <span key={i}>
                                                                    <i className="fa fa-star"></i>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="twm-quote-icon">
                                                <img
                                                    src="assets/images/quote.png"
                                                    alt="#"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
