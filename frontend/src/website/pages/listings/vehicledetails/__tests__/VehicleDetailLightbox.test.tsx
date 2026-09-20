import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* hoisted mocks */
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: 'pub-v1' }),
    useNavigate: () => mockNavigate,
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn(() => null),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useFormatCurrency: vi.fn(() => (n: number) => `GHS ${n}`),
}));

vi.mock('@/shared/libs/currency', () => ({
    formatPriceWithConversion: vi.fn((n: number) => `${n}`),
    formatWithSymbol: vi.fn((n: number, sym: string) => `${sym}${n}`),
}));

vi.mock('@adminConstants/featureIcons', () => ({
    FEATURE_ICON_MAP: {},
}));

vi.mock('react-datepicker', () => ({
    default: ({ onChange }: { onChange: (d: Date) => void }) => (
        <input
            data-testid="date-picker"
            onChange={e => onChange(new Date(e.target.value))}
        />
    ),
}));

vi.mock('@/website/styles/sfBookingCalendar.css', () => ({}));
vi.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

vi.mock('@/services/publicQuoteService', () => ({
    publicQuoteService: {
        getVehicle: vi.fn(),
        getRentalSettings: vi.fn(),
        getPickupLocations: vi.fn(),
        getDropoffLocations: vi.fn(),
        getPricingPreview: vi.fn(),
        submitQuote: vi.fn(),
    },
}));

vi.mock('./BannerSection', () => ({
    BannerSection: () => <div data-testid="banner-section" />,
}));

/*
 * Mock MediaLightbox. The public VehicleDetail will import via a relative path
 * like ../../../../admin/components/MediaLightbox after implementation.
 * We mock the @adminComponents alias which resolves to the same file.
 */
vi.mock('@adminComponents/MediaLightbox', () => ({
    default: ({
        open,
        index,
        onClose,
    }: {
        open: boolean;
        index: number;
        slides: unknown[];
        onClose: () => void;
    }) => (
        <div
            data-testid="media-lightbox"
            data-open={String(open)}
            data-index={String(index)}
            onClick={onClose}
        />
    ),
}));

import { publicQuoteService } from '@/services/publicQuoteService';
import { VehicleDetail } from '../VehicleDetail';

const mockVehicleApiResponse = {
    data: {
        vehicle: {
            id: 'pub-v1',
            name: 'Honda CR-V',
            make: 'Honda',
            model: 'CR-V',
            year: '2023',
            license_plate: 'GT-5678-23',
            status: 'available',
            fuel_type: 'petrol',
            transmission: 'automatic',
            seating_capacity: 5,
            daily_rate: 200,
            security_deposit: 600,
            branch_id: null,
            currency_symbol: null,
            global_currency_symbol: 'GHS',
            exchange_rate: null,
            features: [],
            addons: [],
            auto_charges: [],
            images: [
                {
                    url: 'https://example.com/pub-image1.jpg',
                    thumb: 'https://example.com/pub-image1-thumb.jpg',
                    is_primary: true,
                },
                {
                    url: 'https://example.com/pub-image2.jpg',
                    thumb: 'https://example.com/pub-image2-thumb.jpg',
                    is_primary: false,
                },
            ],
        },
        show_prices_on_website: true,
        allow_online_booking: true,
        vat_enabled: false,
        vat_rate: 0,
        security_deposit_amount: 600,
    },
};

const mockRentalSettings = {
    data: {
        pickup_window_start: '08:00',
        pickup_window_end: '18:00',
        min_rental_days: 1,
    },
};

describe('Public VehicleDetail - Lightbox (Sprint I)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(publicQuoteService.getVehicle).mockResolvedValue(
            mockVehicleApiResponse as never
        );
        vi.mocked(publicQuoteService.getRentalSettings).mockResolvedValue(
            mockRentalSettings as never
        );
        vi.mocked(publicQuoteService.getPickupLocations).mockResolvedValue(
            { data: [] } as never
        );
        vi.mocked(publicQuoteService.getDropoffLocations).mockResolvedValue(
            { data: [] } as never
        );
    });

    it('renders MediaLightbox initially closed', async () => {
        render(<VehicleDetail />);

        /* The component loads vehicle data via useEffect. We test it exists and is closed.
         * FAILS before implementation: MediaLightbox is not imported/rendered in this component yet. */
        const lightbox = await screen.findByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'false');
    });

    it('opens lightbox when main image container is clicked', async () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: no onClick on .twm-car-gallery-main container */
        await screen.findByTestId('media-lightbox');

        const gallery = document.querySelector('.twm-car-gallery-main');
        expect(gallery).not.toBeNull();
        fireEvent.click(gallery!);

        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-open',
            'true'
        );
    });

    it('opens lightbox at correct index when main image container is clicked', async () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: lightbox not rendered */
        await screen.findByTestId('media-lightbox');

        const gallery = document.querySelector('.twm-car-gallery-main');
        fireEvent.click(gallery!);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');
        expect(lightbox).toHaveAttribute('data-index', '0');
    });

    it('closes lightbox when onClose callback fires', async () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: no lightbox */
        await screen.findByTestId('media-lightbox');

        const gallery = document.querySelector('.twm-car-gallery-main');
        fireEvent.click(gallery!);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');

        fireEvent.click(lightbox);
        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-open',
            'false'
        );
    });
});
