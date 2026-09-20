import { useTitle } from '@/shared/hooks';
import FilteredNotificationPage from './FilteredNotificationPage';

export default function OverdueAlerts() {
    const title = useTitle('Overdue Alerts');
    return (
        <>
            {title}
            <FilteredNotificationPage
                title="Overdue Alerts"
                subtitle="Alerts for rentals that have passed their return date."
                typeFilter="rental_overdue"
                emptyMessage="No overdue rental alerts. Great news!"
            />
        </>
    );
}
