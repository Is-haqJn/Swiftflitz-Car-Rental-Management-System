import { Link } from 'react-router-dom';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatPriceWithConversion } from '@/shared/libs/currency';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';

const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

const stripBranch = (name: string) => name.replace(/\s*branch\s*$/i, '').trim();

const FleetVehicleCard = ({ vehicle }: { vehicle: FleetVehicle }) => {
    const { data: generalSettings } = useGeneralSettings();
    const globalCurrency = generalSettings?.data?.currency ?? 'GHS';
    const globalCurrencySymbol = generalSettings?.data?.currency_symbol ?? '₵';

    const photo = vehicle.photos?.[0]?.urls.medium;
    const chauffeurAssignment = vehicle.service_assignments?.find(
        a => a.service_type === 'chauffeur'
    );
    const basePrice = chauffeurAssignment?.base_price ?? null;

    const branchCurrency = vehicle.branch?.currency ?? globalCurrency;
    const { primary: priceDisplay, secondary: convertedDisplay } =
        basePrice !== null
            ? formatPriceWithConversion(
                  basePrice,
                  branchCurrency,
                  vehicle.branch?.exchange_rate,
                  globalCurrency,
                  vehicle.branch?.show_converted_price ?? false,
                  vehicle.branch?.currency_symbol,
                  globalCurrencySymbol,
                  true
              )
            : { primary: null, secondary: null };
    const features = vehicle.features?.slice(0, 3) ?? [];
    const name = `${vehicle.make} ${vehicle.model}`;
    const branchName = vehicle.branch ? stripBranch(vehicle.branch.name) : null;

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
                            className="tw:h-95.5!"
                            src={photo || 'assets/images/vehicle-2/pic14.jpg'}
                            alt={name}
                        />
                        {branchName && (
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
                                {branchName}
                            </span>
                        )}
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
                    </div>
                    <div className="twm-price-section">
                        {priceDisplay !== null && (
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
                        <span>{name}</span>
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
                </div>
            </div>
        </div>
    );
};

interface FleetGridSectionProps {
    vehicles: FleetVehicle[];
    loading: boolean;
}

export const FleetGridSection = ({
    vehicles,
    loading,
}: FleetGridSectionProps) => {
    return (
        <>
            <div className="section-full p-t150 site-bg-white twm-cars4-section-wrap">
                <div className="container">
                    <div className="twm-search-list-filter-wrap">
                        <div className="product-filter-wrap d-flex justify-content-between align-items-center">
                            <span className="woocommerce-result-count-left">
                                {loading
                                    ? 'Loading vehicles...'
                                    : `Showing ${vehicles.length} Chauffeur Vehicle${vehicles.length !== 1 ? 's' : ''}`}
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
                                    <p>No vehicles match your search.</p>
                                </div>
                            ) : (
                                <div className="row">
                                    {vehicles.map(vehicle => (
                                        <FleetVehicleCard
                                            key={vehicle.id}
                                            vehicle={vehicle}
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
