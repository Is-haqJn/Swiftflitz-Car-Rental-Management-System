import { useState, useRef, useEffect, useMemo } from 'react';
import { FEATURE_ICONS, FEATURE_ICON_MAP } from '@adminConstants/featureIcons';

interface IconPickerFieldProps {
    value: string;
    onChange: (iconName: string) => void;
}

export default function IconPickerField({
    value,
    onChange,
}: IconPickerFieldProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) {
            return FEATURE_ICONS;
        }
        const q = search.toLowerCase();
        return FEATURE_ICONS.filter(
            ({ label, name }) =>
                label.toLowerCase().includes(q) ||
                name.toLowerCase().includes(q)
        );
    }, [search]);

    const SelectedIcon = value ? FEATURE_ICON_MAP[value] : null;

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', display: 'inline-block' }}
        >
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                title={SelectedIcon ? value : 'Choose icon'}
                style={{
                    width: '56px',
                    height: '42px',
                    border: '1px solid #ced4da',
                    borderRadius: '0.375rem',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'border-color 0.15s',
                }}
            >
                {SelectedIcon ? (
                    <SelectedIcon size={22} color="#495057" />
                ) : (
                    <span style={{ fontSize: '1.1rem', color: '#adb5bd' }}>
                        ＋
                    </span>
                )}

                {value && (
                    <span
                        onClick={handleClear}
                        title="Remove icon"
                        style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#6c757d',
                            color: '#fff',
                            fontSize: '10px',
                            lineHeight: '16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        ×
                    </span>
                )}
            </button>

            {/* Picker dropdown */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1055,
                        top: '48px',
                        left: 0,
                        width: '308px',
                        background: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Search */}
                    <div style={{ padding: '10px 10px 6px' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search icons…"
                            className="form-control form-control-sm"
                            autoFocus
                        />
                    </div>

                    {/* Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '4px',
                            padding: '4px 10px 10px',
                            maxHeight: '252px',
                            overflowY: 'auto',
                        }}
                    >
                        {filtered.map(({ name, label, Icon }) => {
                            const isSelected = value === name;
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    title={label}
                                    onClick={() => handleSelect(name)}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px solid ${isSelected ? '#126dff' : 'transparent'}`,
                                        borderRadius: '8px',
                                        background: isSelected
                                            ? '#eef0ff'
                                            : 'transparent',
                                        cursor: 'pointer',
                                        transition:
                                            'background 0.1s, border-color 0.1s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background = '#f8f9fa';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <Icon
                                        size={20}
                                        color={
                                            isSelected ? '#126dff' : '#495057'
                                        }
                                    />
                                </button>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div
                                style={{
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: '#adb5bd',
                                    fontSize: '0.875rem',
                                }}
                            >
                                No icons found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
