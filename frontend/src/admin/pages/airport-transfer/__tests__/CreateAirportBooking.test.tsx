import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// mocks (must be before imports that use them)

const { mockNavigate, mockToastSuccess } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockToastSuccess: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('react-hot-toast', () => ({
    default: { success: mockToastSuccess },
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useBranches', () => ({
    useBranches: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useAirportLocations', () => ({
    useAirportTerminals: vi.fn(),
    useAirportAreas: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useAirportPackageAssignments', () => ({
    usePackageAssignmentsByAirport: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useAirportCustomers', () => ({
    useAirportCustomerLookup: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useAirportBookings', () => ({
    useCreateAirportBooking: vi.fn(),
    useAirportBookingBlockedDates: vi.fn(),
}));

vi.mock('@/services/couponService', () => ({
    couponService: { validateCode: vi.fn() },
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useGeneralSettings: vi
        .fn()
        .mockReturnValue({ data: { data: { currency_symbol: '₵' } } }),
}));

// imports (after mocks)

import { useBranches } from '@/shared/hooks/queries/useBranches';
import {
    useAirportTerminals,
    useAirportAreas,
} from '@/shared/hooks/queries/useAirportLocations';
import { usePackageAssignmentsByAirport } from '@/shared/hooks/queries/useAirportPackageAssignments';
import { useAirportCustomerLookup } from '@/shared/hooks/queries/useAirportCustomers';
import {
    useCreateAirportBooking,
    useAirportBookingBlockedDates,
} from '@/shared/hooks/queries/useAirportBookings';
import CreateAirportBooking from '../CreateAirportBooking';

// helpers

const mockUseBranches = vi.mocked(useBranches);
const mockUseAirportTerminals = vi.mocked(useAirportTerminals);
const mockUseAirportAreas = vi.mocked(useAirportAreas);
const mockUsePackageAssignmentsByAirport = vi.mocked(
    usePackageAssignmentsByAirport
);
const mockUseAirportCustomerLookup = vi.mocked(useAirportCustomerLookup);
const mockUseCreateAirportBooking = vi.mocked(useCreateAirportBooking);
const mockUseAirportBookingBlockedDates = vi.mocked(
    useAirportBookingBlockedDates
);

function stubAllHooks(
    mutateOverride?: ReturnType<typeof useCreateAirportBooking>
) {
    mockUseBranches.mockReturnValue({
        data: { data: [] },
        isLoading: false,
    } as unknown as ReturnType<typeof useBranches>);

    mockUseAirportTerminals.mockReturnValue({
        data: { data: [] },
    } as unknown as ReturnType<typeof useAirportTerminals>);

    mockUseAirportAreas.mockReturnValue({
        data: { data: [] },
    } as unknown as ReturnType<typeof useAirportAreas>);

    mockUsePackageAssignmentsByAirport.mockReturnValue({
        data: { data: [] },
    } as unknown as ReturnType<typeof usePackageAssignmentsByAirport>);

    mockUseAirportCustomerLookup.mockReturnValue({
        data: undefined,
    } as unknown as ReturnType<typeof useAirportCustomerLookup>);

    mockUseAirportBookingBlockedDates.mockReturnValue({
        data: { data: { blocked_dates: [] } },
    } as unknown as ReturnType<typeof useAirportBookingBlockedDates>);

    mockUseCreateAirportBooking.mockReturnValue(
        mutateOverride ??
            ({
                mutate: vi.fn(),
                isPending: false,
            } as unknown as ReturnType<typeof useCreateAirportBooking>)
    );
}

// tests

beforeEach(() => {
    vi.clearAllMocks();
});

describe('CreateAirportBooking', () => {
    it('renders without crashing (no infinite re-render)', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        expect(screen.getByText('New Airport Booking')).toBeInTheDocument();
    });

    it('renders booking details section', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        expect(screen.getByText('Booking Details')).toBeInTheDocument();
    });

    it('renders locations section', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        expect(screen.getByText('Locations')).toBeInTheDocument();
    });

    it('navigates back when Back button clicked', async () => {
        stubAllHooks();
        const user = userEvent.setup();
        render(<CreateAirportBooking />);

        await user.click(screen.getByRole('button', { name: /back/i }));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders create booking submit button', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        expect(
            screen.getByRole('button', { name: /create booking/i })
        ).toBeInTheDocument();
    });

    it('disables submit button while mutation is pending', () => {
        stubAllHooks({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<typeof useCreateAirportBooking>);
        render(<CreateAirportBooking />);
        expect(
            screen.getByRole('button', { name: /creating/i })
        ).toBeDisabled();
    });

    it('shows info panel with setup guidance by default', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        expect(
            screen.getByText('Before Creating an Airport Booking')
        ).toBeInTheDocument();
    });

    it('pricing preview is absent when no assignment or area selected', () => {
        stubAllHooks();
        render(<CreateAirportBooking />);
        // Pricing summary card only appears when both assignment + area selected
        expect(screen.queryByText('Pricing Summary')).not.toBeInTheDocument();
    });

    it('does not crash with empty assignments + areas arrays (useMemo stability check)', () => {
        // This test guards against the infinite re-render regression.
        // If useMemo is removed from assignments/areas, the useEffect pricing
        // dep would fire on every render → "Maximum update depth exceeded".
        mockUseAirportAreas.mockReturnValue({
            data: { data: [] },
        } as unknown as ReturnType<typeof useAirportAreas>);

        mockUsePackageAssignmentsByAirport.mockReturnValue({
            data: { data: [] },
        } as unknown as ReturnType<typeof usePackageAssignmentsByAirport>);

        stubAllHooks();

        // If infinite loop occurs, this render call would throw
        expect(() => render(<CreateAirportBooking />)).not.toThrow();
    });
});
