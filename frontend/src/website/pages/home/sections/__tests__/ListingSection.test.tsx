import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetVehicles, mockGetFeaturedChauffeurVehicles } = vi.hoisted(() => ({
    mockGetVehicles: vi.fn(),
    mockGetFeaturedChauffeurVehicles: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
        <a href={to} className={className}>{children}</a>
    ),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useHomepageSettings: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@adminConstants/featureIcons', () => ({
    FEATURE_ICON_MAP: {},
}));

vi.mock('@/shared/libs/currency', () => ({
    formatPriceWithConversion: vi.fn(() => ({ primary: '₵180', secondary: null })),
}));

vi.mock('@/services/publicQuoteService', () => ({
    publicQuoteService: {
        getVehicles: mockGetVehicles,
        getFeaturedChauffeurVehicles: mockGetFeaturedChauffeurVehicles,
    },
}));

import React from 'react';
import { ListingSection } from '../ListingSection';

const chauffeurVehicle = {
    id: 'cv1',
    name: 'Mercedes S-Class',
    make: 'Mercedes',
    model: 'S-Class',
    year: 2023,
    seats: 4,
    fuel_type: 'petrol',
    transmission: 'automatic',
    image: null,
    chauffeur_base_price: 250,
    currency_symbol: '¢',
};

beforeEach(() => {
    vi.clearAllMocks();
    mockGetVehicles.mockResolvedValue({
        data: { vehicles: [], show_prices_on_website: true },
    });
    mockGetFeaturedChauffeurVehicles.mockResolvedValue({ data: [] });
});

async function renderWithChauffeur() {
    mockGetFeaturedChauffeurVehicles.mockResolvedValue({
        data: [chauffeurVehicle],
    });
    await act(async () => {
        render(<ListingSection />);
    });
    await act(async () => {});
}

describe('ChauffeurVehicleCard', () => {
    it('renders the vehicle name', async () => {
        await renderWithChauffeur();
        expect(screen.getByText('Mercedes S-Class')).toBeInTheDocument();
    });

    it('renders the Chauffeur badge', async () => {
        await renderWithChauffeur();
        expect(screen.getByText('Chauffeur')).toBeInTheDocument();
    });

    it('Chauffeur badge has position absolute style', async () => {
        await renderWithChauffeur();
        const badge = screen.getByText('Chauffeur');
        expect(badge).toHaveStyle({ position: 'absolute' });
    });

    it('Chauffeur badge is NOT a child of .twm-price-section', async () => {
        await renderWithChauffeur();
        const badge = screen.getByText('Chauffeur');
        let el: HTMLElement | null = badge.parentElement;
        let inPriceSection = false;
        while (el) {
            if (el.classList.contains('twm-price-section')) {
                inPriceSection = true;
                break;
            }
            el = el.parentElement;
        }
        expect(inPriceSection).toBe(false);
    });

    it('renders chauffeur_base_price with / Trip label', async () => {
        await renderWithChauffeur();
        expect(screen.getByText(/250/)).toBeInTheDocument();
        expect(screen.getByText('/ Trip')).toBeInTheDocument();
    });

    it('does not render price section when chauffeur_base_price is null', async () => {
        mockGetFeaturedChauffeurVehicles.mockResolvedValue({
            data: [{ ...chauffeurVehicle, chauffeur_base_price: null }],
        });
        await act(async () => { render(<ListingSection />); });
        await act(async () => {});
        expect(screen.queryByText('/ Trip')).not.toBeInTheDocument();
    });
});
