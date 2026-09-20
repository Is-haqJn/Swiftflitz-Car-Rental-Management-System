import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import {
    publicQuoteService,
    type PublicVehicle,
} from '@/services/publicQuoteService';
import { formatPriceWithConversion } from '@/shared/libs/currency';

const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

const VehicleCard = ({
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
        <div
            className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 m-b30 wow fadeInDown"
            data-wow-delay="0.2"
            // style={{ display: 'flex' }}
        >
            <div
                className="twm-vehicle-fleet-bx2 twm-custom-grid-3"
                // style={{
                //     display: 'flex',
                //     flexDirection: 'column',
                //     width: '100%',
                // }}
            >
                <div className="twm-media">
                    <div
                        className="twm-media-pic"
                        // style={{ aspectRatio: '1/1', overflow: 'hidden' }}
                    >
                        <img
                            className="tw:h-95.5!"
                            src={
                                vehicle.image ||
                                'assets/images/vehicle-2/pic14.jpg'
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
                        <span>{vehicle.name}</span>
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
                        <ul className="twm-vehicle-fuel-type">
                            {features.map(feat => {
                                const Icon = FEATURE_ICON_MAP[feat];
                                return (
                                    <li key={feat}>
                                        {Icon ? (
                                            <Icon
                                                size={14}
                                                style={{ marginRight: 4 }}
                                            />
                                        ) : null}
                                        {feat}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* <ul className="twm-vehicle-f">
                        <Link
                            to={`/listings/${vehicle.id}`}
                            className="site-button-secondry btn-block"
                        >
                            <li>
                                {canShowPrice ? 'Book Now' : 'Request Quote'}
                            </li>
                        </Link>
                    </ul> */}
                </div>
            </div>
        </div>
    );
};

export const CarGridSection = () => {
    const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
    const [showPrice, setShowPrice] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        publicQuoteService
            .getVehicles()
            .then(res => {
                setShowPrice(res.data.show_prices_on_website);
                setVehicles(res.data.vehicles);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <div className="section-full p-t150 site-bg-white twm-cars4-section-wrap">
                <div className="container">
                    <div className="twm-search-list-filter-wrap">
                        <div className="product-filter-wrap d-flex justify-content-between align-items-center">
                            <span className="woocommerce-result-count-left">
                                {loading
                                    ? 'Loading vehicles...'
                                    : `Showing ${vehicles.length} Vehicle${vehicles.length !== 1 ? 's' : ''}`}
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
                            ) : vehicles.length === 0 ? (
                                <div className="text-center p-t50 p-b50">
                                    <p>No vehicles available at the moment.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="row">
                                        {vehicles.map(vehicle => (
                                            <VehicleCard
                                                key={vehicle.id}
                                                vehicle={vehicle}
                                                showPrice={showPrice}
                                            />
                                        ))}
                                    </div>
                                    <div className="pagination-outer d-flex justify-content-center">
                                        <div className="pagination-style1">
                                            <ul className="clearfix">
                                                <li className="prev">
                                                    <Link
                                                        to={'/listings?page=1'}
                                                    >
                                                        <span>
                                                            {' '}
                                                            <i className="fa-solid fa-chevron-left"></i>{' '}
                                                        </span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to={'/listings?page=1'}
                                                    >
                                                        1
                                                    </Link>
                                                </li>
                                                <li className="active">
                                                    <Link
                                                        to={'/listings?page=2'}
                                                    >
                                                        2
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to={'/listings?page=3'}
                                                    >
                                                        3
                                                    </Link>
                                                </li>
                                                <li className="next">
                                                    <Link
                                                        to={'/listings?page=4'}
                                                    >
                                                        <span>
                                                            {' '}
                                                            <i className="fa-solid fa-chevron-right"></i>{' '}
                                                        </span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
