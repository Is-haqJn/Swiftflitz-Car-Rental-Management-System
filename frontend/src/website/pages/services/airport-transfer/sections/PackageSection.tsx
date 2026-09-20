import {
    type PublicPackageItem,
    publicAirportService,
} from '@/services/publicAirportService';
import { formatPriceWithConversion } from '@/shared/libs/currency';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AirportBookingModal } from './AirportBookingModal';

export const PackageSection = () => {
    const [searchParams] = useSearchParams();
    const airportId = searchParams.get('airport_id') ?? undefined;

    const [packages, setPackages] = useState<PublicPackageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] =
        useState<PublicPackageItem | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        publicAirportService.packages(airportId).then(data => {
            if (!cancelled) {
                setPackages(data);
                setIsLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [airportId, setPackages]);

    const handleBookNow = (pkg: PublicPackageItem) => {
        if (!airportId) return;
        setSelectedPackage(pkg);
    };

    const handleCloseModal = () => {
        setSelectedPackage(null);
    };

    return (
        <>
            <div
                className="section-full p-t80 p-b120 site-bg-light twm-step-towards-section-wrap wow fadeInDown"
                data-wow-offset="100"
                data-wow-delay="0.2"
            >
                <div className="container">
                    <div className="section-head center">
                        <div className="twm-sm-title left">Pricing Plan</div>
                        <h2 className="twm-large-title site-text-dark">
                            Choose Your Package & Travel in Comfort!
                        </h2>
                    </div>

                    <div className="section-content">
                        {isLoading ? (
                            <div className="row twm-pricing-section d-flex justify-content-center">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="col-lg-4 col-md-6 col-10"
                                    >
                                        <div className="twm-price-bx">
                                            <div className="twm-price-bx-detail">
                                                <div className="twm-price-head">
                                                    <h2
                                                        className="twm-title placeholder-glow"
                                                        aria-hidden="true"
                                                    >
                                                        <span className="placeholder col-6" />
                                                    </h2>
                                                    <div className="twm-price-digit placeholder-glow">
                                                        <span className="placeholder col-4" />
                                                    </div>
                                                </div>
                                                <div className="twm-price-info">
                                                    <div className="twm-list placeholder-glow">
                                                        <ul>
                                                            {[1, 2, 3, 4].map(
                                                                j => (
                                                                    <li key={j}>
                                                                        <span className="placeholder col-8" />
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="text-center p-t50 p-b50">
                                <p>
                                    No packages available for this airport at
                                    this time.
                                </p>
                            </div>
                        ) : (
                            <div className="row twm-pricing-section d-flex justify-content-center">
                                {packages.map(pkg => (
                                    <div
                                        key={pkg.id}
                                        className="col-lg-4 col-md-6 col-10"
                                    >
                                        <div className="twm-price-bx">
                                            <div className="twm-price-bx-detail">
                                                <div className="twm-price-head">
                                                    <h2 className="twm-title">
                                                        {pkg.name}
                                                    </h2>
                                                    <div className="twm-price-digit">
                                                        <div className="twm-price">
                                                            {pkg.base_price !==
                                                            null ? (
                                                                (() => {
                                                                    const globalCurrency =
                                                                        pkg.global_currency ??
                                                                        'GHS';
                                                                    const branchCurrency =
                                                                        pkg.currency ??
                                                                        globalCurrency;
                                                                    const priceDisplay =
                                                                        formatPriceWithConversion(
                                                                            parseFloat(
                                                                                pkg.base_price
                                                                            ),
                                                                            branchCurrency,
                                                                            pkg.exchange_rate,
                                                                            globalCurrency,
                                                                            pkg.show_converted_price ??
                                                                                false,
                                                                            pkg.currency_symbol,
                                                                            pkg.global_currency_symbol,
                                                                            true
                                                                        );
                                                                    return (
                                                                        <>
                                                                            {
                                                                                priceDisplay.primary
                                                                            }
                                                                            {priceDisplay.secondary && (
                                                                                <span
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '0.75em',
                                                                                        color: '#999',
                                                                                        fontWeight: 400,
                                                                                        whiteSpace:
                                                                                            'nowrap',
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        ' / '
                                                                                    }
                                                                                    {
                                                                                        priceDisplay.secondary
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            '1rem',
                                                                    }}
                                                                >
                                                                    Select an
                                                                    airport
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="twm-price-info">
                                                    {pkg.description && (
                                                        <p
                                                            style={{
                                                                marginBottom:
                                                                    '1rem',
                                                            }}
                                                        >
                                                            {pkg.description}
                                                        </p>
                                                    )}
                                                    {pkg.features.length >
                                                        0 && (
                                                        <div className="twm-list">
                                                            <ul>
                                                                {pkg.features.map(
                                                                    feature => (
                                                                        <li
                                                                            key={
                                                                                feature
                                                                            }
                                                                        >
                                                                            {
                                                                                feature
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="twm-purchase-btn">
                                                        <button
                                                            type="button"
                                                            className="site-button"
                                                            disabled={
                                                                !airportId
                                                            }
                                                            title={
                                                                !airportId
                                                                    ? 'Please select an airport first'
                                                                    : undefined
                                                            }
                                                            onClick={() =>
                                                                handleBookNow(
                                                                    pkg
                                                                )
                                                            }
                                                        >
                                                            <em>Book Now</em>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedPackage && airportId && (
                <AirportBookingModal
                    pkg={selectedPackage}
                    airportId={airportId}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};
