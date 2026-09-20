import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicQuoteService } from '@/services/publicQuoteService';
import { apiClient } from '@/shared/api/apiClient';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import type { ApiResponse } from '@/shared/types';

const stripBranch = (name: string) => name.replace(/\s*branch\s*$/i, '').trim();

export const SearchSection = () => {
    const navigate = useNavigate();
    const [branchId, setBranchId] = useState('');
    const [category, setCategory] = useState('');
    const [service, setService] = useState('');
    const [date, setDate] = useState('');

    const [branches, setBranches] = useState<{ id: string; name: string }[]>(
        []
    );
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([
            publicQuoteService.getVehicles(),
            apiClient.get<ApiResponse<FleetVehicle[]>>(
                '/public/chauffeur-vehicles'
            ),
        ]).then(([rentalRes, chauffeurRes]) => {
            const branchMap = new Map<string, string>();
            const categorySet = new Set<string>();

            rentalRes.data.vehicles.forEach(v => {
                if (v.branch_id && v.branch_name)
                    branchMap.set(v.branch_id, v.branch_name);
                if (v.category?.name) categorySet.add(v.category.name);
            });

            chauffeurRes.data.forEach(v => {
                if (v.branch_id && v.branch?.name)
                    branchMap.set(v.branch_id, stripBranch(v.branch.name));
                const assignment = v.service_assignments?.find(
                    a => a.service_type === 'chauffeur'
                );
                if (assignment?.category?.name)
                    categorySet.add(assignment.category.name);
            });

            setBranches(
                Array.from(branchMap.entries()).map(([id, name]) => ({
                    id,
                    name,
                }))
            );
            setCategories(Array.from(categorySet));
        });
    }, []);

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
            <div className="twm-search-section-wrap">
                <div className="container">
                    <div className="twm-search-section-area">
                        <h3 className="twm-s-section-title">
                            Available for rent
                        </h3>
                        <div className="twm-vehicle-search-section">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Location</label>
                                <select
                                    className="form-select form-control"
                                    value={branchId}
                                    onChange={e => setBranchId(e.target.value)}
                                >
                                    <option value="">All Locations</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Category</label>
                                <select
                                    className="form-select form-control"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Service</label>
                                <select
                                    className="form-select form-control"
                                    value={service}
                                    onChange={e => setService(e.target.value)}
                                >
                                    <option value="">All Services</option>
                                    <option value="rental">Self-Drive</option>
                                    <option value="chauffeur">Chauffeur</option>
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
                                                    .split('T')[0]
                                            }
                                            onChange={e =>
                                                setDate(e.target.value)
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
                                    <em>Search Available Cars</em>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
