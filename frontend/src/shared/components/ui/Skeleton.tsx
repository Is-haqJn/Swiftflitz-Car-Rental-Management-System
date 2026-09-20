import { Card } from 'react-bootstrap';

/* SkeletonBlock - single shimmer span */
interface SkeletonBlockProps {
    col?: number;
    height?: string | number;
    rounded?: boolean;
    className?: string;
}

export function SkeletonBlock({
    col = 10,
    height,
    rounded = true,
    className = '',
}: SkeletonBlockProps) {
    return (
        <div className="placeholder-glow">
            <span
                className={`placeholder col-${col}${rounded ? ' rounded' : ''}${className ? ` ${className}` : ''}`}
                style={height ? { height } : undefined}
            />
        </div>
    );
}

/* SkeletonText - stacked lines of varying width */
interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
    const widths = [10, 8, 6, 10, 7, 9];
    return (
        <div className={`placeholder-glow ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <span
                    key={i}
                    className={`placeholder col-${widths[i % widths.length]} rounded d-block mb-1`}
                />
            ))}
        </div>
    );
}

/* SkeletonCard - card shell with placeholder rows */
interface SkeletonCardProps {
    rows?: number;
    headerWidth?: number;
    className?: string;
}

export function SkeletonCard({
    rows = 4,
    headerWidth = 6,
    className = '',
}: SkeletonCardProps) {
    const rowWidths = [10, 8, 9, 7, 10, 6];
    return (
        <Card className={`border-0 shadow-sm ${className}`}>
            <Card.Header className="bg-white border-bottom">
                <div className="placeholder-glow">
                    <span
                        className={`placeholder col-${headerWidth} rounded`}
                        style={{ height: '1.1rem' }}
                    />
                </div>
            </Card.Header>
            <Card.Body>
                <div className="placeholder-glow">
                    {Array.from({ length: rows }).map((_, i) => (
                        <span
                            key={i}
                            className={`placeholder col-${rowWidths[i % rowWidths.length]} rounded d-block mb-2`}
                            style={{ height: '0.85rem' }}
                        />
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
}

/* SkeletonStatCard - mimics ic-chart-card */
export function SkeletonStatCard() {
    return (
        <div className="card ic-chart-card">
            <div className="card-header d-block border-0 pb-0">
                <div className="placeholder-glow mb-2">
                    <span
                        className="placeholder col-6 rounded"
                        style={{ height: '0.75rem' }}
                    />
                </div>
                <div className="placeholder-glow mb-1">
                    <span
                        className="placeholder col-4 rounded"
                        style={{ height: '1.75rem' }}
                    />
                </div>
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-8 rounded"
                        style={{ height: '0.65rem' }}
                    />
                </div>
            </div>
        </div>
    );
}

/* SkeletonTableRows - table body placeholder rows */
interface SkeletonTableRowsProps {
    rows?: number;
    cols?: number;
}

export function SkeletonTableRows({
    rows = 5,
    cols = 5,
}: SkeletonTableRowsProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j}>
                            <div className="placeholder-glow">
                                <span className="placeholder col-10 rounded" />
                            </div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/* SkeletonFormRows - label + input placeholder rows */
interface SkeletonFormRowsProps {
    rows?: number;
}

export function SkeletonFormRows({ rows = 5 }: SkeletonFormRowsProps) {
    return (
        <div className="placeholder-glow">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="mb-3">
                    <span
                        className="placeholder col-3 rounded d-block mb-1"
                        style={{ height: '0.75rem' }}
                    />
                    <span
                        className="placeholder col-12 rounded d-block"
                        style={{ height: '2.4rem' }}
                    />
                </div>
            ))}
        </div>
    );
}
