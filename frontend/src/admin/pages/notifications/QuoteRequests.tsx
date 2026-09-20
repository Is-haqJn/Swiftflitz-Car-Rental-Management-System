import { useTitle } from '@/shared/hooks';
import FilteredNotificationPage from './FilteredNotificationPage';

export default function QuoteRequests() {
    const title = useTitle('Quote Requests');
    return (
        <>
            {title}
            <FilteredNotificationPage
                title="Quote Requests"
                subtitle="Notifications for new quote requests from customers."
                typeFilter="new_quote_request"
                emptyMessage="No quote request notifications yet."
            />
        </>
    );
}
