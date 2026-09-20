import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import {
    publicQuoteService,
    type PublicVehicle,
    type PublicFeaturedFleetVehicle,
} from '@/services/publicQuoteService';
import { useHomepageSettings } from '@/shared/hooks/queries/useSettings';
import { formatPriceWithConversion } from '@/shared/libs/currency';

declare global {
    interface Window {
        jQuery?: any;
    }
}

const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

const ChauffeurVehicleCard = ({
    vehicle,
}: {
    vehicle: PublicFeaturedFleetVehicle;
}) => {
    return (
        <div className="item">
            <div className="twm-vehicle-fleet-bx2 twm-custom-grid-3">
                <div className="twm-media" style={{ position: 'relative' }}>
                    <span
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1,
                            display: 'inline-block',
                            background: '#b8860b',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Chauffeur
                    </span>
                    <div className="twm-media-pic">
                        <img
                            className="tw:h-95.5!"
                            src={
                                vehicle.image ||
                                'assets/images/vehicle-2/pic1.jpg'
                            }
                            alt={vehicle.name}
                        />
                    </div>
                    <div className="twm-price-section">
                        {vehicle.chauffeur_base_price != null && (
                            <>
                                <div className="v-price">
                                    <span>
                                        {vehicle.currency_symbol ?? vehicle.global_currency_symbol ?? '₵'}
                                        {vehicle.chauffeur_base_price.toLocaleString()}
                                    </span>
                                </div>
                                <div className="v-duration">/ Trip</div>
                            </>
                        )}
                        <Link
                            to={`/chauffeur-services/${vehicle.id}`}
                            className="v-detail"
                        >
                            <em>Book Now</em>
                        </Link>
                    </div>
                </div>
                <div className="twm-vehicle-fleet-content" style={{ flex: 1 }}>
                    <h3 className="twm-v-title">
                        <Link
                            to={`/chauffeur-services/${vehicle.id}`}
                            style={{ color: '#333' }}
                        >
                            {vehicle.name}
                        </Link>
                    </h3>
                    <ul className="twm-vehicle-facility">
                        <li>
                            <span>
                                <img
                                    src="assets/images/icons/car-seat.png"
                                    alt="Seats"
                                />
                            </span>
                            {vehicle.seats} Seat
                        </li>
                        {vehicle.fuel_type && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car-insurance.png"
                                        alt="Fuel"
                                    />
                                </span>
                                {vehicle.fuel_type === 'petrol'
                                    ? 'Petrol'
                                    : vehicle.fuel_type === 'diesel'
                                      ? 'Diesel'
                                      : vehicle.fuel_type === 'electric'
                                        ? 'Electric'
                                        : vehicle.fuel_type === 'hybrid'
                                          ? 'Hybrid'
                                          : vehicle.fuel_type}
                            </li>
                        )}
                        {vehicle.transmission && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car.png"
                                        alt="Transmission"
                                    />
                                </span>
                                {vehicle.transmission === 'automatic'
                                    ? 'Auto'
                                    : 'Manual'}
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const FeaturedVehicleCard = ({
    vehicle,
    showPrice,
}: {
    vehicle: PublicVehicle;
    showPrice: boolean;
}) => {
    const canShowPrice = showPrice && vehicle.price_visible;
    const features = vehicle.features?.slice(0, 3) ?? [];

    const globalCurrency = vehicle.global_currency ?? 'GHS';
    const branchCurrency = vehicle.currency ?? globalCurrency;
    const { primary: priceDisplay, secondary: convertedDisplay } =
        formatPriceWithConversion(
            vehicle.daily_rate,
            branchCurrency,
            vehicle.exchange_rate,
            globalCurrency,
            vehicle.show_converted_price ?? false,
            vehicle.currency_symbol,
            vehicle.global_currency_symbol,
            true
        );

    return (
        <div className="item">
            <div className="twm-vehicle-fleet-bx2 twm-custom-grid-3">
                <div className="twm-media">
                    <div className="twm-media-pic">
                        <img
                            className="tw:h-95.5!"
                            src={
                                vehicle.image ||
                                'assets/images/vehicle-2/pic1.jpg'
                            }
                            alt={vehicle.name}
                        />
                    </div>
                    <div className="twm-price-section">
                        {canShowPrice && (
                            <>
                                <div className="v-price">
                                    <span>{priceDisplay}</span>
                                    {convertedDisplay && (
                                        <small
                                            className="text-muted d-block"
                                            style={{ fontSize: '0.75em' }}
                                        >
                                            / {convertedDisplay}
                                        </small>
                                    )}
                                </div>
                                <div className="v-duration">/ Day</div>
                            </>
                        )}
                        <Link
                            to={`/listings/${vehicle.id}`}
                            className="v-detail"
                        >
                            <em>
                                {canShowPrice ? 'Book Now' : 'Request Quote'}
                            </em>
                        </Link>
                    </div>
                </div>
                <div className="twm-vehicle-fleet-content" style={{ flex: 1 }}>
                    <h3 className="twm-v-title">
                        <Link to={`/listings/${vehicle.id}`}>
                            {vehicle.name}
                        </Link>
                    </h3>
                    <ul className="twm-vehicle-facility">
                        <li>
                            <span>
                                <img
                                    src="assets/images/icons/car-seat.png"
                                    alt="Seats"
                                />
                            </span>
                            {vehicle.seats} Seat
                        </li>
                        {vehicle.fuel_type && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car-insurance.png"
                                        alt="Fuel"
                                    />
                                </span>
                                {FUEL_LABEL[vehicle.fuel_type] ??
                                    vehicle.fuel_type}
                            </li>
                        )}
                        {vehicle.transmission && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car.png"
                                        alt="Transmission"
                                    />
                                </span>
                                {vehicle.transmission === 'automatic'
                                    ? 'Auto'
                                    : 'Manual'}
                            </li>
                        )}
                    </ul>
                    {features.length > 0 && (
                        <ul
                            className="d-flex flex-wrap gap-2"
                            style={{ listStyle: 'none', padding: 0, margin: 0 }}
                        >
                            {features.map(feat => {
                                const Icon = FEATURE_ICON_MAP[feat];
                                return (
                                    <li
                                        key={feat}
                                        className="d-flex align-items-center gap-2"
                                        style={{ fontSize: 13 }}
                                    >
                                        <span
                                            className="d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 15,
                                                height: 15,
                                                borderRadius: '50%',
                                                background: '#126DFF',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {Icon ? (
                                                <Icon size={11} color="#fff" />
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: '#fff',
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    <FaCheck />
                                                </span>
                                            )}
                                        </span>
                                        {feat}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

type CarouselItem =
    | { kind: 'rental'; vehicle: PublicVehicle }
    | { kind: 'chauffeur'; vehicle: PublicFeaturedFleetVehicle };

export const ListingSection = () => {
    const { data: settingsRes } = useHomepageSettings();
    const s = settingsRes?.data;

    const [items, setItems] = useState<CarouselItem[]>([]);
    const [showPrice, setShowPrice] = useState(false);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([
            publicQuoteService.getVehicles(),
            publicQuoteService
                .getFeaturedChauffeurVehicles()
                .catch(() => ({ data: [] as PublicFeaturedFleetVehicle[] })),
        ])
            .then(([rentalRes, chauffeurRes]) => {
                setShowPrice(rentalRes.data.show_prices_on_website);
                const rentalItems: CarouselItem[] = rentalRes.data.vehicles
                    .filter(v => v.is_featured === true)
                    .map(v => ({ kind: 'rental', vehicle: v }));
                const chauffeurItems: CarouselItem[] = (
                    chauffeurRes.data ?? []
                ).map(v => ({ kind: 'chauffeur', vehicle: v }));
                setItems([...rentalItems, ...chauffeurItems]);
            })
            .finally(() => setLoading(false));
    }, []);

    const vehicles = items;

    // Returns how many items OWL shows at the current viewport width.
    const getEffectiveItems = () => {
        const w = window.innerWidth;
        if (w >= 1200) return 3;
        if (w >= 768) return 2;
        return 1;
    };

    // Initialise (or re-initialise) OWL Carousel after React has committed
    // the vehicle cards to the DOM. Re-runs on breakpoint changes so loop
    // threshold stays accurate across screen sizes.
    useEffect(() => {
        if (loading || vehicles.length === 0) return;
        if (!window.jQuery || !carouselRef.current) return;

        const $ = window.jQuery;

        const init = () => {
            if (!carouselRef.current) return;
            const $el = $(carouselRef.current);
            if ($el.data('owlCarousel')) $el.owlCarousel('destroy');

            const count = vehicles.length;
            const effectiveItems = getEffectiveItems();
            const shouldLoop = count > effectiveItems;

            $el.owlCarousel({
                loop: shouldLoop,
                autoplay: shouldLoop,
                margin: 30,
                autoplayTimeout: 3000,
                nav: shouldLoop,
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
        };

        init();

        let lastBreakpoint = getEffectiveItems();
        let debounceTimer: ReturnType<typeof setTimeout>;

        const onResize = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const bp = getEffectiveItems();
                if (bp !== lastBreakpoint) {
                    lastBreakpoint = bp;
                    init();
                }
            }, 150);
        };

        window.addEventListener('resize', onResize);
        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', onResize);
            if (carouselRef.current) {
                const $el = $(carouselRef.current);
                if ($el.data('owlCarousel')) $el.owlCarousel('destroy');
            }
        };
    }, [loading, vehicles]);

    return (
        <>
            <div
                className="section-full p-t150 p-b120 site-bg-white twm-blog-section-wrap wow fadeInDown"
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container-fluid">
                    <div className="section-head center ">
                        <div className="twm-sm-title left">
                            {s?.featured_title ?? 'Choose your car'}
                        </div>
                        <h2 className="twm-large-title site-text-dark">
                            {s?.featured_large_title ?? 'Our Featured Vehicles'}
                        </h2>
                    </div>

                    <div className="section-content">
                        {loading ? (
                            <div className="row m-b30">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="col-lg-4 col-md-6 m-b30"
                                    >
                                        <div
                                            className="twm-vehicle-fleet-bx"
                                            style={{
                                                minHeight: 280,
                                                background: '#f5f5f5',
                                                borderRadius: 8,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="text-center p-t50 p-b50">
                                <p>
                                    {s?.featured_empty_text ??
                                        'No featured vehicles at the moment.'}
                                </p>
                            </div>
                        ) : (
                            <div
                                ref={carouselRef}
                                className="owl-carousel twm-vehicle-fleet-carousel m-b30"
                            >
                                {vehicles.map(item =>
                                    item.kind === 'chauffeur' ? (
                                        <ChauffeurVehicleCard
                                            key={`chauffeur-${item.vehicle.id}`}
                                            vehicle={item.vehicle}
                                        />
                                    ) : (
                                        <FeaturedVehicleCard
                                            key={`rental-${item.vehicle.id}`}
                                            vehicle={item.vehicle}
                                            showPrice={showPrice}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
