import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* hoisted mocks */
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: 'v1' }),
    useNavigate: () => mockNavigate,
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn(() => null),
}));

vi.mock('@/shared/hooks/queries/useVehicles', () => ({
    useVehicle: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useFormatCurrency: vi.fn(() => (n: number) => `GHS ${n}`),
    useGeneralSettings: vi.fn(() => ({
        data: { data: { currency_symbol: '₵' } },
    })),
}));

vi.mock('@/store', () => ({
    useAppSelector: vi.fn(() => null),
}));

vi.mock('@/store/slices/activeBranchSlice', () => ({
    selectActiveBranchId: vi.fn(),
}));

vi.mock('@/shared/libs/currency', () => ({
    formatWithSymbol: vi.fn((n: number, sym: string) => `${sym}${n}`),
}));

vi.mock('@/shared/components/common/PermissionGuard', () => ({
    PermisssionGuard: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

vi.mock('@adminPages/vehicles/VehicleExpenseModal', () => ({
    default: () => null,
}));

vi.mock('@adminComponents/skeletons/DetailPageSkeleton', () => ({
    DetailPageSkeleton: () => <div data-testid="detail-skeleton" />,
}));

/* Mock MediaLightbox - this is what the tests assert exists after implementation */
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

import { useVehicle } from '@/shared/hooks/queries/useVehicles';
import VehicleDetail from '../VehicleDetail';

const mockVehicle = {
    id: 'v1',
    name: 'Toyota Camry',
    make: 'Toyota',
    model: 'Camry',
    year: '2022',
    license_plate: 'GR-1234-22',
    status: 'available',
    fuel_type: 'petrol',
    transmission: 'automatic',
    seating_capacity: 5,
    mileage: 0,
    daily_rate: 150,
    security_deposit: 500,
    has_insurance: false,
    insurance_expiry: null,
    roadworthy_expiry: null,
    branch: null,
    branch_id: null,
    currency: 'GHS',
    currency_symbol: '₵',
    exchange_rate: 1,
    category: { id: 'cat-1', name: 'Sedan', daily_rate: 150 },
    features: [],
    images: [
        {
            id: 1,
            is_primary: true,
            urls: {
                large: 'https://example.com/image1-large.jpg',
                thumb: 'https://example.com/image1-thumb.jpg',
                original: 'https://example.com/image1-original.jpg',
            },
        },
        {
            id: 2,
            is_primary: false,
            urls: {
                large: 'https://example.com/image2-large.jpg',
                thumb: 'https://example.com/image2-thumb.jpg',
                original: 'https://example.com/image2-original.jpg',
            },
        },
    ],
};

describe('VehicleDetail - Lightbox (Sprint I)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useVehicle).mockReturnValue({
            data: { data: mockVehicle },
            isLoading: false,
            isError: false,
            error: null,
        } as unknown as ReturnType<typeof useVehicle>);
    });

    it('renders MediaLightbox initially closed', () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: MediaLightbox is not imported in VehicleDetail yet */
        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'false');
    });

    it('opens lightbox at index 0 when main image is clicked', () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: no onClick on main image container */
        const mainImage = screen.getByAltText('Toyota Camry');
        fireEvent.click(mainImage);

        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-open',
            'true'
        );
        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-index',
            '0'
        );
    });

    it('closes lightbox when onClose is triggered', () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: no lightbox present at all */
        const mainImage = screen.getByAltText('Toyota Camry');
        fireEvent.click(mainImage);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');

        fireEvent.click(lightbox);
        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-open',
            'false'
        );
    });

    it('opens lightbox at correct index when thumbnail is clicked', () => {
        render(<VehicleDetail />);

        /* FAILS before implementation: no lightbox at all */
        const thumbnails = screen.getAllByAltText(/Thumbnail/);
        fireEvent.click(thumbnails[1]);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');
        expect(lightbox).toHaveAttribute('data-index', '1');
    });
});
