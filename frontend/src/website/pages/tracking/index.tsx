import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMagnifyingGlass } from 'react-icons/fa6';

export default function TrackingPage() {
    const [reference, setReference] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ref = reference.trim().toUpperCase();
        if (ref) navigate(`/track/${ref}`);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(160deg, #f8faff 0%, #eef2ff 60%, #f0fdf4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '100px 16px 60px',
            }}
        >
            <div
                style={{
                    maxWidth: 460,
                    width: '100%',
                    background: '#fff',
                    borderRadius: 20,
                    boxShadow: '0 20px 60px rgba(0,0,0,.10)',
                    padding: '48px 40px',
                    textAlign: 'center',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}
                >
                    <FaMagnifyingGlass size={28} color="#fff" />
                </div>

                <h2
                    style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        marginBottom: 6,
                    }}
                >
                    Track Your Rental
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
                    Enter your rental reference number below
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="form-control"
                            style={{
                                borderRadius: 10,
                                fontSize: 15,
                                textTransform: 'uppercase',
                                flex: 1,
                            }}
                            id="reference"
                            placeholder="RF-2026-00001"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                // padding: '10px 20px',
                                fontWeight: 600,
                                fontSize: 14,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                            }}
                            className='btn'
                        >
                            Track &rarr;
                        </button>
                    </div>
                </form>

                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
                    Your reference number is in your booking confirmation email.
                </p>
            </div>
        </div>
    );
}
