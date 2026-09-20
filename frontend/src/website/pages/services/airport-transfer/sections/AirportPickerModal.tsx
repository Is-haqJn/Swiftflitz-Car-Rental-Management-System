import type { Airport } from '@/shared/types/airport.types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaMagnifyingGlass } from 'react-icons/fa6';

interface Props {
    airports: Airport[];
    selectedAirportId: string;
    onSelect: (airport: Airport) => void;
    onClose: () => void;
}

export const AirportPickerModal = ({
    airports,
    selectedAirportId,
    onSelect,
    onClose,
}: Props) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const airportsByCity = useMemo(() => {
        const map = new Map<string, Airport[]>();
        for (const airport of airports) {
            const list = map.get(airport.city) ?? [];
            list.push(airport);
            map.set(airport.city, list);
        }
        return map;
    }, [airports]);

    const cities = useMemo(
        () => [...airportsByCity.keys()].sort(),
        [airportsByCity]
    );

    const selectedAirportCity = useMemo(
        () => airports.find(a => a.id === selectedAirportId)?.city ?? '',
        [airports, selectedAirportId]
    );

    const [expandedCities, setExpandedCities] = useState<Set<string>>(
        () =>
            new Set(
                selectedAirportCity ? [selectedAirportCity] : cities.slice(0, 1)
            )
    );

    const filteredAirports = useMemo(() => {
        if (!searchQuery.trim()) {
            return null;
        }
        const q = searchQuery.toLowerCase();
        return airports.filter(
            a =>
                a.name.toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q)
        );
    }, [airports, searchQuery]);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const toggleCity = (city: string) => {
        setExpandedCities(prev => {
            const next = new Set(prev);
            if (next.has(city)) {
                next.delete(city);
            } else {
                next.add(city);
            }
            return next;
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '10px',
                    width: '100%',
                    maxWidth: '460px',
                    maxHeight: '72vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.1rem 1.25rem 0.9rem',
                        borderBottom: '1px solid #f0f0f0',
                    }}
                >
                    <span
                        className="site-text-dark"
                        style={{ fontWeight: 700, fontSize: '1rem' }}
                    >
                        Select Airport
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.3rem',
                            cursor: 'pointer',
                            color: '#888',
                            lineHeight: 1,
                            padding: '0 0.2rem',
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '0.75rem 1.25rem 0' }}>
                    <div style={{ position: 'relative' }}>
                        <span
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#aaa',
                                fontSize: '0.9rem',
                            }}
                        >
                            <FaMagnifyingGlass />
                        </span>
                        <input
                            ref={searchRef}
                            type="text"
                            className="form-control"
                            placeholder="Search airports..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.2rem' }}
                        />
                    </div>
                </div>

                {/* List */}
                <div
                    style={{
                        overflowY: 'auto',
                        flex: 1,
                        padding: '0.5rem 0 0.75rem',
                    }}
                >
                    {filteredAirports !== null ? (
                        // Search results - flat list
                        filteredAirports.length === 0 ? (
                            <div
                                style={{
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    color: '#999',
                                }}
                            >
                                No airports found
                            </div>
                        ) : (
                            filteredAirports.map(airport => (
                                <AirportRow
                                    key={airport.id}
                                    airport={airport}
                                    isSelected={
                                        airport.id === selectedAirportId
                                    }
                                    onSelect={onSelect}
                                />
                            ))
                        )
                    ) : (
                        // City accordion view
                        cities.map(city => {
                            const isExpanded = expandedCities.has(city);
                            return (
                                <div key={city}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCity(city)}
                                        style={{
                                            width: '100%',
                                            background: 'none',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1.25rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                color: '#888',
                                                transition: 'transform 0.15s',
                                                display: 'inline-block',
                                                transform: isExpanded
                                                    ? 'rotate(90deg)'
                                                    : 'none',
                                            }}
                                        >
                                            ▶
                                        </span>
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.06em',
                                                color: '#444',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {city}
                                        </span>
                                    </button>
                                    {isExpanded &&
                                        (airportsByCity.get(city) ?? []).map(
                                            airport => (
                                                <AirportRow
                                                    key={airport.id}
                                                    airport={airport}
                                                    isSelected={
                                                        airport.id ===
                                                        selectedAirportId
                                                    }
                                                    onSelect={onSelect}
                                                    indent
                                                />
                                            )
                                        )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const AirportRow = ({
    airport,
    isSelected,
    onSelect,
    indent = false,
}: {
    airport: Airport;
    isSelected: boolean;
    onSelect: (a: Airport) => void;
    indent?: boolean;
}) => (
    <button
        type="button"
        onClick={() => onSelect(airport)}
        style={{
            width: '100%',
            background: isSelected ? '#f0f7ff' : 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0.55rem 1.25rem 0.55rem ${indent ? '2.5rem' : '1.25rem'}`,
            cursor: 'pointer',
            textAlign: 'left',
            borderLeft: isSelected
                ? '3px solid var(--color-primary, #0d6efd)'
                : '3px solid transparent',
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
            {!indent && (
                <div style={{ fontSize: '0.78rem', color: '#999' }}>
                    {airport.city}
                </div>
            )}
        </div>
        {isSelected && (
            <span
                style={{ color: '#0d6efd', fontWeight: 700, fontSize: '1rem' }}
            >
                <FaCheck />
            </span>
        )}
    </button>
);
