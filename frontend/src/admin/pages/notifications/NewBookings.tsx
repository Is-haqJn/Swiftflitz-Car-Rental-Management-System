import { useTitle } from '@/shared/hooks';
import FilteredNotificationPage from './FilteredNotificationPage';

export default function NewBookings() {
    const title = useTitle('New Bookings');
    return (
        <>
            {title}
            <FilteredNotificationPage
                title="New Bookings"
                subtitle="Notifications for new rental bookings and reservations."
                typeFilter="booking_created"
                emptyMessage="No new booking notifications yet."
            />
        </>
    );
}
