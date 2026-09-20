import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import { useFormatCurrency } from '@/shared/hooks/queries';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatPriceWithConversion } from '@/shared/libs/currency';
import type { UnifiedListing } from '../index';

const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

const ListingCard = ({ listing }: { listing: UnifiedListing }) => {
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalCurrencySymbol =
        listing.global_currency_symbol ??
        generalSettings?.data?.currency_symbol ??
        '₵';
    const features = listing.features?.slice(0, 3) ?? [];

    const globalCurrency =
        listing.global_currency ?? generalSettings?.data?.currency ?? 'GHS';
    const branchCurrency = listing.currency ?? globalCurrency;
    const { primary: priceDisplay, secondary: convertedDisplay } =
        listing.price != null
            ? formatPriceWithConversion(
                  listing.price,
                  branchCurrency,
                  listing.exchange_rate,
                  globalCurrency,
                  listing.show_converted_price ?? false,
                  listing.currency_symbol,
                  globalCurrencySymbol,
                  true
              )
            : { primary: formatCurrency(0), secondary: null };

    return (
        <div
            className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 m-b30 wow fadeInDown"
            data-wow-delay="0.2"
        >
            <div className="twm-vehicle-fleet-bx2 twm-custom-grid-3">
                <div className="twm-media">
                    <div
                        className="twm-media-pic"
                        style={{ position: 'relative' }}
                    >
                        <img
                            className="tw:h-80!"
                            src={
                                listing.image ||
                                'assets/images/vehicle-2/pic14.jpg'
                            }
                            alt={listing.name}
                        />
                        {listing.branch_name && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 10,
                                    left: 10,
                                    background: 'rgba(0,0,0,0.55)',
                                    color: '#fff',
                                    fontSize: 12,
                                    padding: '3px 8px',
                                    borderRadius: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <i
                                    className="fa-solid fa-location-dot"
                                    style={{ fontSize: 11 }}
                                ></i>
                                {listing.branch_name}
                            </span>
                        )}
                        {listing.type === 'chauffeur' && (
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: 10,
                                    left: 10,
                                    background: 'rgba(201,149,0,0.85)',
                                    color: '#fff',
                                    fontSize: 12,
                                    padding: '3px 8px',
                                    borderRadius: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <i
                                    className="fa-solid fa-user-tie"
                                    style={{ fontSize: 11 }}
                                ></i>
                                Chauffeur
                            </span>
                        )}
                    </div>
                    <div className="twm-price-section">
                        {listing.price_visible && listing.price != null && (
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
                                <div className="v-duration">
                                    /{' '}
                                    {listing.price_unit === 'trip'
                                        ? 'Trip'
                                        : 'Day'}
                                </div>
                            </>
                        )}
                        <Link to={listing.detail_url} className="v-detail">
                            <em>
                                {listing.price_visible
                                    ? 'Book Now'
                                    : 'Request Quote'}
                            </em>
                        </Link>
                    </div>
                </div>

                <div className="twm-vehicle-fleet-content" style={{ flex: 1 }}>
                    <h3 className="twm-v-title">
                        <span>{listing.name}</span>
                    </h3>

                    <ul className="twm-vehicle-facility">
                        <li>
                            <span>
                                <img
                                    src="assets/images/icons/car-seat.png"
                                    alt="Seats"
                                />
                            </span>
                            {listing.seats} Seat
                        </li>
                        {listing.fuel_type && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car-insurance.png"
                                        alt="Fuel"
                                    />
                                </span>
                                {FUEL_LABEL[listing.fuel_type] ??
                                    listing.fuel_type}
                            </li>
                        )}
                        {listing.transmission && (
                            <li>
                                <span>
                                    <img
                                        src="assets/images/icons/car.png"
                                        alt="Transmission"
                                    />
                                </span>
                                {listing.transmission === 'automatic'
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
                            {features.map((feat: string) => {
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

interface CarGridSectionProps {
    listings: UnifiedListing[];
    loading: boolean;
}

export const CarGridSection = ({ listings, loading }: CarGridSectionProps) => {
    return (
        <>
            <div className="section-full p-t150 site-bg-white twm-cars4-section-wrap">
                <div className="container">
                    <div className="twm-search-list-filter-wrap">
                        <div className="product-filter-wrap d-flex justify-content-between align-items-center">
                            <span className="woocommerce-result-count-left">
                                {loading
                                    ? 'Loading vehicles...'
                                    : `Showing ${listings.length} Vehicle${listings.length !== 1 ? 's' : ''}`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="container-fluid">
                    <div className="section-content">
                        <div className="twm-cars-section m-b30">
                            {loading ? (
                                <div className="row">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 m-b30"
                                        >
                                            <div
                                                className="twm-vehicle-fleet-bx2 twm-custom-grid-3"
                                                style={{
                                                    minHeight: 300,
                                                    background: '#f5f5f5',
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : listings.length === 0 ? (
                                <div className="text-center p-t50 p-b50">
                                    <p>No vehicles match your search.</p>
                                </div>
                            ) : (
                                <div className="row">
                                    {listings.map(listing => (
                                        <ListingCard
                                            key={`${listing.type}-${listing.id}`}
                                            listing={listing}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
