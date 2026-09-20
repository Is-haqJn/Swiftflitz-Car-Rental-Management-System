import { publicAirportService } from '@/services/publicAirportService';
import type { Airport } from '@/shared/types/airport.types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCheck, FaPlane, FaMagnifyingGlass } from 'react-icons/fa6';

export const SearchSection = () => {
    const [airports, setAirports] = useState<Airport[]>([]);
    const [selectedAirport, setSelectedAirport] = useState<Airport | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        publicAirportService.airports().then(res => {
            const data = res.data ?? [];
            setAirports(data);

            if (data.length === 0) {
                setIsLoading(false);
                return;
            }

            const urlAirportId = searchParams.get('airport_id');
            let initial: Airport | undefined;

            if (urlAirportId) {
                initial = data.find(a => a.id === urlAirportId);
            }

            if (!initial) {
                initial = data.find(a => a.is_default) ?? data[0];
                setSearchParams({ airport_id: initial.id }, { replace: true });
            }

            setSelectedAirport(initial);
            setIsLoading(false);
        });
        // run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelect = (airport: Airport) => {
        setSelectedAirport(airport);
        setSearchParams({ airport_id: airport.id });
    };

    return (
        <div className="twm-search-section-wrap">
            <div className="container">
                <div className="twm-search-section-area">
                    <h3 className="twm-s-section-title">Search Our Packages</h3>

                    <div className="twm-vehicle-search-section">
                        <div style={{ flex: 1 }} className="form-group">
                            <label>Airport</label>
                            <AirportCombobox
                                airports={airports}
                                selected={selectedAirport}
                                isLoading={isLoading}
                                onSelect={handleSelect}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Combobox */

const AirportCombobox = ({
    airports,
    selected,
    isLoading,
    onSelect,
}: {
    airports: Airport[];
    selected: Airport | null;
    isLoading: boolean;
    onSelect: (airport: Airport) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Focus search on open, clear query on close, close on ESC
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            return;
        }
        searchRef.current?.focus();
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen]);

    const filtered = useMemo(() => {
        if (!query.trim()) return airports;
        const q = query.toLowerCase();
        return airports.filter(
            a =>
                a.name.toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q)
        );
    }, [airports, query]);

    const grouped = useMemo(() => {
        const map = new Map<string, Airport[]>();
        for (const a of filtered) {
            const list = map.get(a.city) ?? [];
            list.push(a);
            map.set(a.city, list);
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [filtered]);

    const handleSelect = (airport: Airport) => {
        onSelect(airport);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger */}
            <button
                type="button"
                className="form-control"
                onClick={() => !isLoading && setIsOpen(o => !o)}
                disabled={isLoading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    cursor: isLoading ? 'default' : 'pointer',
                    background: '#fff',
                    height: 'auto',
                    minHeight: '48px',
                    padding: '0.5rem 0.9rem',
                    borderColor: isOpen
                        ? 'var(--color-primary, #c0392b)'
                        : undefined,
                    boxShadow: isOpen
                        ? '0 0 0 3px rgba(192,57,43,0.12)'
                        : undefined,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
            >
                {isLoading ? (
                    <span style={{ color: '#aaa' }}>Loading airports...</span>
                ) : selected ? (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>
                            <FaPlane />
                        </span>
                        <span>
                            <span
                                style={{
                                    fontWeight: 600,
                                    display: 'block',
                                    lineHeight: 1.2,
                                }}
                            >
                                {selected.name}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                {selected.city} · {selected.country}
                            </span>
                        </span>
                    </span>
                ) : (
                    <span style={{ color: '#aaa' }}>Select an airport</span>
                )}
                <span
                    style={{
                        color: '#888',
                        fontSize: '0.8rem',
                        marginLeft: '0.5rem',
                        display: 'inline-block',
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                    }}
                >
                    ▾
                </span>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        maxHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Search input */}
                    <div
                        style={{
                            padding: '0.6rem 0.75rem',
                            borderBottom: '1px solid #f0f0f0',
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <span
                                style={{
                                    position: 'absolute',
                                    left: '0.65rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#bbb',
                                    fontSize: '0.85rem',
                                    pointerEvents: 'none',
                                }}
                            >
                                <FaMagnifyingGlass />
                            </span>
                            <input
                                ref={searchRef}
                                type="text"
                                className="form-control"
                                placeholder="Search airports..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                style={{
                                    paddingLeft: '2rem',
                                    fontSize: '0.9rem',
                                    height: '36px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Airport list */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {grouped.length === 0 ? (
                            <div
                                style={{
                                    padding: '1.25rem',
                                    textAlign: 'center',
                                    color: '#999',
                                    fontSize: '0.9rem',
                                }}
                            >
                                No airports found
                            </div>
                        ) : query.trim() ? (
                            // Flat list for search results
                            filtered.map(airport => (
                                <AirportOption
                                    key={airport.id}
                                    airport={airport}
                                    isSelected={airport.id === selected?.id}
                                    onSelect={handleSelect}
                                />
                            ))
                        ) : (
                            // Grouped by city when not searching
                            grouped.map(([city, list]) => (
                                <div key={city}>
                                    {grouped.length > 1 && (
                                        <div
                                            style={{
                                                padding: '0.4rem 0.85rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: '#aaa',
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                background: '#fafafa',
                                            }}
                                        >
                                            {city}
                                        </div>
                                    )}
                                    {list.map(airport => (
                                        <AirportOption
                                            key={airport.id}
                                            airport={airport}
                                            isSelected={
                                                airport.id === selected?.id
                                            }
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* Airport option row */

const AirportOption = ({
    airport,
    isSelected,
    onSelect,
}: {
    airport: Airport;
    isSelected: boolean;
    onSelect: (a: Airport) => void;
}) => (
    <button
        type="button"
        onClick={() => onSelect(airport)}
        style={{
            width: '100%',
            background: isSelected ? '#fff8f8' : 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            cursor: 'pointer',
            textAlign: 'left',
            borderLeft: isSelected
                ? '3px solid var(--color-primary, #c0392b)'
                : '3px solid transparent',
        }}
        onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.background = '#f9f9f9';
        }}
        onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.background = 'none';
        }}
    >
        <div>
            <div
                style={{
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.9rem',
                    color: '#222',
                }}
            >
                {airport.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#999' }}>
                {airport.city} · {airport.country}
            </div>
        </div>
        {isSelected && (
            <span
                style={{
                    color: 'var(--color-primary, #c0392b)',
                    fontWeight: 700,
                    fontSize: '1rem',
                }}
            >
                <FaCheck />
            </span>
        )}
    </button>
);
