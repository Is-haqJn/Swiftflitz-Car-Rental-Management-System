import { Badge } from 'react-bootstrap';
import type { Rental } from '@/shared/types/rental.types';
import { useOverdueSettings } from '@/shared/hooks/queries/useSettings';

/**
 * Renders the "Overdue" status badge with a live elapsed-time sub-label.
 *
 * Elapsed time is computed client-side from return_date + return_time vs now.
 * Billing mode is determined by overdue_threshold_hours from OverdueSettings:
 *   - ≤ threshold  → hourly billing  → shows "+Xh Ym"
 *   - > threshold  → daily billing   → shows "+Xd · daily rate"
 */
export default function OverdueBadge({ rental }: { rental: Rental }) {
    const { data: settings } = useOverdueSettings();
    const thresholdHours = settings?.data?.overdue_threshold_hours ?? 24;

    const scheduledReturn = new Date(
        `${rental.return_date}T${rental.return_time ?? '17:00'}`
    );
    const overdueMinutes = Math.max(
        0,
        Math.floor((Date.now() - scheduledReturn.getTime()) / 60_000)
    );

    let subLabel: string | null = null;

    if (overdueMinutes > 0) {
        const thresholdMins = thresholdHours * 60;

        if (overdueMinutes <= thresholdMins) {
            const h = Math.floor(overdueMinutes / 60);
            const m = overdueMinutes % 60;
            subLabel = h > 0 ? (m > 0 ? `+${h}h ${m}m` : `+${h}h`) : `+${m}m`;
        } else {
            const days = Math.ceil(overdueMinutes / 1440);
            subLabel = `+${days}d · daily rate`;
        }
    }

    return (
        <div className="d-flex flex-column align-items-start gap-1">
            <Badge bg="danger">Overdue</Badge>
            {subLabel && (
                <small
                    className="text-danger fw-semibold lh-1"
                    style={{ fontSize: '0.7rem' }}
                >
                    {subLabel}
                </small>
            )}
        </div>
    );
}
