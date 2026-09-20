import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/shared/libs/utils';
import { useServicesSettings } from '@/shared/hooks/queries/useSettings';
import type { UnifiedListing } from '../index';

const BANNER_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

interface BannerSectionProps {
    className?: string;
    listings: UnifiedListing[];
}

export const BannerSection = ({ className, listings }: BannerSectionProps) => {
    const { data: res } = useServicesSettings();
    const backgroundImage =
        res?.data?.listings_banner_image_url ?? BANNER_IMAGE_FALLBACK;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [branchId, setBranchId] = useState(searchParams.get('branch_id') ?? '');
    const [category, setCategory] = useState(searchParams.get('category') ?? '');
    const [service, setService] = useState(searchParams.get('service') ?? '');
    const [date, setDate] = useState(searchParams.get('date') ?? '');

    const branches = Array.from(
        new Map(
            listings
                .filter(l => l.branch_id && l.branch_name)
                .map(l => [l.branch_id, l.branch_name!])
        ).entries()
    ).map(([id, name]) => ({ id: id!, name }));

    const categories = Array.from(
        new Set(
            listings
                .map(l => l.category_name)
                .filter((n): n is string => Boolean(n))
        )
    );

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (branchId) params.set('branch_id', branchId);
        if (category) params.set('category', category);
        if (service) params.set('service', service);
        if (date) params.set('date', date);
        navigate(`/listings?${params.toString()}`);
    };

    return (
        <>
            <div
                className={cn(
                    'wt-bnr-inr twm-inner-banner-s-bar site-bg-dark twm-primary-overlay-wrap',
                    className
                )}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="twm-primary-overlay"></div>

                <div className="container">
                    <div className="wt-bnr-inr-entry">
                        <div className="banner-title-outer">
                            <div className="banner-title-name">
                                <h2 className="wt-title">Rent A Car</h2>
                            </div>

                            <div className="twm-search-section-wrap">
                                <div className="container">
                                    <div className="twm-search-section-area">
                                        <h3 className="twm-s-section-title">
                                            Check for Availability
                                        </h3>
                                        <div className="twm-vehicle-search-section">
                                            <div
                                                className="form-group"
                                                style={{ flex: 1 }}
                                            >
                                                <label>Location</label>
                                                <select
                                                    className="form-select form-control"
                                                    value={branchId}
                                                    onChange={e =>
                                                        setBranchId(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All Locations
                                                    </option>
                                                    {branches.map(b => (
                                                        <option
                                                            key={b.id}
                                                            value={b.id}
                                                        >
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div
                                                className="form-group"
                                                style={{ flex: 1 }}
                                            >
                                                <label>Category</label>
                                                <select
                                                    className="form-select form-control"
                                                    value={category}
                                                    onChange={e =>
                                                        setCategory(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All Categories
                                                    </option>
                                                    {categories.map(cat => (
                                                        <option
                                                            key={cat}
                                                            value={cat}
                                                        >
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div
                                                className="form-group"
                                                style={{ flex: 1 }}
                                            >
                                                <label>Service</label>
                                                <select
                                                    className="form-select form-control"
                                                    value={service}
                                                    onChange={e =>
                                                        setService(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All Services
                                                    </option>
                                                    <option value="rental">
                                                        Self-Drive
                                                    </option>
                                                    <option value="chauffeur">
                                                        Chauffeur
                                                    </option>
                                                </select>
                                            </div>

                                            <div
                                                className="form-group form-group-2column-wrap twm-input-with-icon"
                                                style={{ flex: 1 }}
                                            >
                                                <label>Pick up date</label>
                                                <div className="form-group-2column">
                                                    <div className="input-group date datepicker">
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={date}
                                                            min={
                                                                new Date()
                                                                    .toISOString()
                                                                    .split(
                                                                        'T'
                                                                    )[0]
                                                            }
                                                            onChange={e =>
                                                                setDate(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                        <span className="input-group-append input-group-addon">
                                                            <span className="input-group-text">
                                                                <i className="fa fa-solid fa-calendar-days"></i>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="twm-vehicle-search-btn">
                                                <button
                                                    type="button"
                                                    className="site-button"
                                                    onClick={handleSearch}
                                                >
                                                    <em>
                                                        Search Available Cars
                                                    </em>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
