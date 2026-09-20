import { useTitle } from '@/shared/hooks';
import FilteredNotificationPage from './FilteredNotificationPage';

export default function ReturnReminders() {
    const title = useTitle('Return Reminders');
    return (
        <>
            {title}
            <FilteredNotificationPage
                title="Return Reminders"
                subtitle="Upcoming vehicle return reminders for active rentals."
                typeFilter="return_reminder"
                emptyMessage="No return reminder notifications yet."
            />
        </>
    );
}
