import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/libs/utils';
import { useServicesSettings } from '@/shared/hooks/queries/useSettings';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';

const stripBranch = (name: string) => name.replace(/\s*branch\s*$/i, '').trim();

const BANNER_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

interface BannerSectionProps {
    className?: string;
    vehicles?: FleetVehicle[];
}

export const BannerSection = ({
    className,
    vehicles = [],
}: BannerSectionProps) => {
    const { data: res } = useServicesSettings();
    const backgroundImage =
        res?.data?.chauffeur_banner_image_url ?? BANNER_IMAGE_FALLBACK;
    const navigate = useNavigate();
    const [branchId, setBranchId] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');

    const branches = Array.from(
        new Map(
            vehicles
                .filter(v => v.branch_id && v.branch)
                .map(v => [v.branch_id, stripBranch(v.branch!.name)])
        ).entries()
    ).map(([id, name]) => ({ id, name }));

    const categories = Array.from(
        new Set(
            vehicles.flatMap(v =>
                (v.service_assignments ?? [])
                    .filter(
                        a => a.service_type === 'chauffeur' && a.category?.name
                    )
                    .map(a => a.category!.name)
            )
        )
    );

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (branchId) params.set('branch_id', branchId);
        if (category) params.set('category', category);
        if (date) params.set('date', date);
        navigate(`/chauffeur-services?${params.toString()}`);
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
                                <h2 className="wt-title">Chauffeur Services</h2>
                            </div>

                            <div className="twm-search-section-wrap">
                                <div className="container">
                                    <div className="twm-search-section-area">
                                        <h3 className="twm-s-section-title">
                                            Available for hire
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
                                                    <em>Find A Vehicle</em>
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
