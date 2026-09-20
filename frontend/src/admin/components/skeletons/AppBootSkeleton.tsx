export function AppBootSkeleton() {
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
            }}
        >
            {/* Sidebar placeholder */}
            <div
                className="placeholder-glow"
                style={{
                    width: 220,
                    minWidth: 220,
                    backgroundColor: '#f1f3f5',
                    borderRight: '1px solid #e9ecef',
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                <span
                    className="placeholder rounded"
                    style={{ height: '2rem', width: '70%', display: 'block' }}
                />
                <span
                    className="placeholder rounded"
                    style={{
                        height: '1rem',
                        width: '45%',
                        display: 'block',
                        marginTop: '1.5rem',
                    }}
                />
                {Array.from({ length: 6 }).map((_, i) => (
                    <span
                        key={i}
                        className="placeholder rounded"
                        style={{
                            height: '2.25rem',
                            display: 'block',
                            width: `${70 + (i % 3) * 10}%`,
                        }}
                    />
                ))}
            </div>

            {/* Main content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Topbar placeholder */}
                <div
                    className="placeholder-glow d-flex align-items-center gap-3"
                    style={{
                        height: 60,
                        borderBottom: '1px solid #e9ecef',
                        padding: '0 1.5rem',
                        backgroundColor: '#fff',
                    }}
                >
                    <span
                        className="placeholder rounded"
                        style={{
                            width: 32,
                            height: 32,
                            display: 'inline-block',
                        }}
                    />
                    <span style={{ flex: 1 }} />
                    <span
                        className="placeholder rounded"
                        style={{
                            width: 32,
                            height: 32,
                            display: 'inline-block',
                        }}
                    />
                    <span
                        className="placeholder rounded-circle"
                        style={{
                            width: 36,
                            height: 36,
                            display: 'inline-block',
                        }}
                    />
                </div>

                {/* Page body placeholder */}
                <div
                    className="placeholder-glow"
                    style={{
                        padding: '1.5rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}
                >
                    <span
                        className="placeholder rounded"
                        style={{
                            height: '1.4rem',
                            width: '20%',
                            display: 'block',
                        }}
                    />
                    <span
                        className="placeholder rounded"
                        style={{
                            height: '0.8rem',
                            width: '35%',
                            display: 'block',
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '0.5rem',
                        }}
                    >
                        {Array.from({ length: 4 }).map((_, i) => (
                            <span
                                key={i}
                                className="placeholder rounded"
                                style={{
                                    flex: 1,
                                    height: 80,
                                    display: 'block',
                                }}
                            />
                        ))}
                    </div>
                    <span
                        className="placeholder rounded"
                        style={{ height: 200, display: 'block' }}
                    />
                    <span
                        className="placeholder rounded"
                        style={{ height: 120, display: 'block' }}
                    />
                </div>
            </div>
        </div>
    );
}
