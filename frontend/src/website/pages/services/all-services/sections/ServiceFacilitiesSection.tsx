import type { ServiceFacilityCard } from '@/shared/types';
import { useServicesSettings } from '@/shared/hooks/queries/useSettings';
import { Link } from 'react-router-dom';

const DEFAULT_CARDS: ServiceFacilityCard[] = [
    {
        image_url: '',
        title: 'Car Rental',
        description:
            'Choose from our wide range of vehicles and enjoy a seamless self-drive rental experience at competitive rates.',
        button_text: 'Book Now',
        button_url: '/listings',
    },
    {
        image_url: '',
        title: 'Chauffeur Service',
        description:
            'Travel in style and comfort with our professional chauffeur-driven vehicles for any occasion.',
        button_text: 'Book Now',
        button_url: '/chauffeur-services',
    },
    {
        image_url: '',
        title: 'Airport Transfer',
        description:
            'Reliable and punctual airport transfers to and from all major airports, available 24/7.',
        button_text: 'Book Now',
        button_url: '/airport-transfer',
    },
];

const FALLBACK_IMAGE = '/assets/images/main-slider/slide2/bg-pic1.jpg';

export const ServiceFacilitiesSection = () => {
    const { data: res } = useServicesSettings();
    const s = res?.data ?? {};

    const title = s.facilities_title ?? 'Our Services';
    const largeTitle = s.facilities_large_title ?? 'What We Offer';
    const cards: ServiceFacilityCard[] = s.facilities_cards ?? DEFAULT_CARDS;
    return (
        <div
            className="section-full p-t120 p-b120 site-bg-white twm-facilities-section-wrap wow fadeInDown"
            data-wow-offset="100"
            data-wow-delay="0.2"
        >
            <div className="container">
                <div className="section-head center">
                    <div className="twm-sm-title left">{title}</div>
                    <h2 className="twm-large-title site-text-dark">
                        {largeTitle}
                    </h2>
                </div>

                <div className="section-content">
                    <div className="row twm-step-towards-section">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="col-lg-4 col-md-6 col-sm-6 m-b30 d-flex"
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        background: '#f4f5f7',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    {/* Image */}
                                    <img
                                        src={
                                            card.image_url
                                                ? card.image_url.startsWith(
                                                      'http'
                                                  )
                                                    ? card.image_url
                                                    : `/${card.image_url.replace(/^\//, '')}`
                                                : FALLBACK_IMAGE
                                        }
                                        alt={card.title ?? 'service'}
                                        onError={e => {
                                            (
                                                e.currentTarget as HTMLImageElement
                                            ).src = FALLBACK_IMAGE;
                                        }}
                                        style={{
                                            width: '100%',
                                            height: 220,
                                            objectFit: 'cover',
                                            display: 'block',
                                            flexShrink: 0,
                                        }}
                                    />

                                    {/* Content */}
                                    <div
                                        style={{
                                            padding: '24px 24px 28px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            flex: 1,
                                            alignItems: 'center',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {card.title && (
                                            <h3
                                                className="twm-title"
                                                style={{ marginBottom: 10 }}
                                            >
                                                {card.title}
                                            </h3>
                                        )}
                                        {card.description && (
                                            <p
                                                style={{
                                                    flex: 1,
                                                    marginBottom: 0,
                                                }}
                                            >
                                                {card.description}
                                            </p>
                                        )}
                                        {card.button_text &&
                                            card.button_url && (
                                                <div style={{ marginTop: 20 }}>
                                                    <Link
                                                        to={card.button_url}
                                                        className="site-button"
                                                    >
                                                        {card.button_text}
                                                    </Link>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
