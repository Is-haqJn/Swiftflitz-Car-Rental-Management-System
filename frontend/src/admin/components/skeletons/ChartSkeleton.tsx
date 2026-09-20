/* Skeleton placeholder for chart areas */

const BAR_HEIGHTS = [60, 90, 45, 120, 75, 100, 55, 140, 85, 110, 65, 95];

export function ChartSkeleton({ height = 260 }: { height?: number }) {
    return (
        <div
            className="d-flex align-items-end gap-2 px-3 pb-2 placeholder-glow"
            style={{ height }}
        >
            {BAR_HEIGHTS.map((h, i) => (
                <span
                    key={i}
                    className="placeholder rounded flex-grow-1"
                    style={{ height: `${h}px` }}
                />
            ))}
        </div>
    );
}
