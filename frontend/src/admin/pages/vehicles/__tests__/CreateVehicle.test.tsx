import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* hoisted mocks */
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useVehicles', () => ({
    useCreateVehicle: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useUpdateVehicle: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/shared/hooks/queries/useCategories', () => ({
    useCategories: vi.fn(),
}));

vi.mock('@/shared/hooks/queries/useFeatures', () => ({
    useActiveFeatures: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/shared/hooks/queries/useBranches', () => ({
    useActiveBranches: vi.fn(() => ({ data: { data: [] } })),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useCurrency: vi.fn(() => 'GHS'),
    useGeneralSettings: vi.fn(() => ({ data: { data: { currency_symbol: '₵' } } })),
}));

vi.mock('@/store/slices/authSlice', () => ({
    selectAuthUser: vi.fn(() => ({ branches: [] })),
}));

vi.mock('react-redux', () => ({
    useSelector: (selector: (s: unknown) => unknown) => selector({}),
}));

vi.mock('@/admin/components/DatePickerField', () => ({
    default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <input data-testid="date-picker" value={value} onChange={(e) => onChange(e.target.value)} readOnly />
    ),
}));

/* imports after mocks */
import { useCategories } from '@/shared/hooks/queries/useCategories';
import CreateVehicle from '../CreateVehicle';

const mockCategories = [
    { id: 'cat-1', name: 'Sedan', daily_rate: 100 },
    { id: 'cat-2', name: 'SUV', daily_rate: 200 },
];

const mockVehicle = {
    id: 'veh-1',
    name: 'Toyota Camry',
    make: 'Toyota',
    model: 'Camry',
    year: '2022',
    license_plate: 'GR-1234-22',
    category_id: 'cat-1',
    category: { id: 'cat-1', name: 'Sedan' },
    branch_id: null,
    branch: null,
    status: 'available',
    daily_rate: 150,
    security_deposit: 500,
    has_insurance: false,
    has_roadworthy: false,
    insurance_expiry_date: null,
    roadworthy_expiry_date: null,
    features: [],
    young_driver_age_threshold: null,
    young_driver_deposit: null,
    is_featured: false,
};

/* helper: get the category <select> by name attribute */
function getCategorySelect(container: HTMLElement): HTMLSelectElement {
    return container.querySelector('select[name="category_id"]') as HTMLSelectElement;
}

describe('CreateVehicle - category pre-fill on edit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('pre-fills category when vehicle loads before categories (race condition fix)', async () => {
        /* categories not yet loaded */
        vi.mocked(useCategories).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useCategories>);

        const { rerender, container } = render(
            <CreateVehicle vehicle={mockVehicle as never} />,
        );

        /* select exists but has no option for cat-1 yet */
        expect(getCategorySelect(container).value).toBe('');

        /* categories arrive */
        vi.mocked(useCategories).mockReturnValue({
            data: { data: mockCategories },
            isLoading: false,
        } as unknown as ReturnType<typeof useCategories>);

        rerender(<CreateVehicle vehicle={mockVehicle as never} />);

        /* reset() must have run: select now holds cat-1 */
        await waitFor(() => {
            expect(getCategorySelect(container).value).toBe('cat-1');
        });
    });

    it('pre-fills category immediately when categories already loaded', async () => {
        vi.mocked(useCategories).mockReturnValue({
            data: { data: mockCategories },
            isLoading: false,
        } as unknown as ReturnType<typeof useCategories>);

        const { container } = render(<CreateVehicle vehicle={mockVehicle as never} />);

        await waitFor(() => {
            expect(getCategorySelect(container).value).toBe('cat-1');
        });
    });

    it('renders both category options from mock data', async () => {
        vi.mocked(useCategories).mockReturnValue({
            data: { data: mockCategories },
            isLoading: false,
        } as unknown as ReturnType<typeof useCategories>);

        const { container } = render(<CreateVehicle vehicle={mockVehicle as never} />);

        await waitFor(() => {
            const select = getCategorySelect(container);
            const options = Array.from(select.options).map(o => o.value);
            expect(options).toContain('cat-1');
            expect(options).toContain('cat-2');
        });
    });
});
