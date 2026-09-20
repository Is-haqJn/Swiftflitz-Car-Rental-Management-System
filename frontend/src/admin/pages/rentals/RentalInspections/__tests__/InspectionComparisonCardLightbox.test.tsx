import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RentalInspection } from '@/shared/types/rental.types';
import type { RentalVideoMedia } from '@/shared/types/rental.types';

vi.mock('@adminComponents/MediaLightbox', () => ({
    default: ({ open, slides }: { open: boolean; slides: unknown[] }) =>
        open ? (
            <div data-testid="lightbox" data-slides-count={slides?.length ?? 0} />
        ) : null,
}));

import InspectionComparisonCard from '../InspectionComparisonCard';

function makeInspection(overrides: Partial<RentalInspection> = {}): RentalInspection {
    return {
        id: 'insp-1',
        rental_id: 'rental-1',
        type: 'pickup',
        inspector_id: null,
        inspector: null,
        fuel_level: 'full',
        mileage: null,
        condition_notes: null,
        damage_noted: false,
        damage_types: null,
        damage_severity: null,
        damage_description: null,
        photos: [],
        swap_vehicle_id: null,
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z',
        ...overrides,
    };
}

function makeVideo(overrides: Partial<RentalVideoMedia> = {}): RentalVideoMedia {
    return {
        id: 1,
        url: 'https://example.com/video.mp4',
        stream_url: 'https://example.com/videos/1/stream',
        thumbnail_url: null,
        mime_type: 'video/mp4',
        video_deleted: false,
        ...overrides,
    };
}

describe('InspectionComparisonCard - lightbox behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders thumbnails from inspection.photos', () => {
        const inspection = makeInspection({
            photos: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        });

        render(<InspectionComparisonCard inspections={[inspection]} />);

        const thumbs = screen.getAllByRole('img');
        expect(thumbs).toHaveLength(2);
    });

    it('opens MediaLightbox when thumbnail clicked', async () => {
        const inspection = makeInspection({
            photos: ['https://example.com/a.jpg'],
        });

        render(<InspectionComparisonCard inspections={[inspection]} />);

        const thumb = screen.getByRole('img');
        await userEvent.click(thumb);

        expect(screen.getByTestId('lightbox')).toBeDefined();
    });

    it('includes pickup_video items as video slides when rental.pickup_videos provided', async () => {
        const inspection = makeInspection({
            photos: ['https://example.com/a.jpg'],
        });

        const pickupVideos: RentalVideoMedia[] = [makeVideo(), makeVideo({ id: 2 })];

        render(
            <InspectionComparisonCard
                inspections={[inspection]}
                pickupVideos={pickupVideos}
            />,
        );

        const thumb = screen.getByRole('img');
        await userEvent.click(thumb);

        /* 1 photo + 2 videos = 3 slides */
        expect(
            screen.getByTestId('lightbox').getAttribute('data-slides-count'),
        ).toBe('3');
    });

    it('includes return_video items as video slides when rental.return_videos provided', async () => {
        const inspection = makeInspection({
            type: 'return',
            photos: ['https://example.com/a.jpg'],
        });

        const returnVideos: RentalVideoMedia[] = [makeVideo()];

        render(
            <InspectionComparisonCard
                inspections={[inspection]}
                returnVideos={returnVideos}
            />,
        );

        const thumb = screen.getByRole('img');
        await userEvent.click(thumb);

        /* 1 photo + 1 video = 2 slides */
        expect(
            screen.getByTestId('lightbox').getAttribute('data-slides-count'),
        ).toBe('2');
    });

    it('omits video slides when arrays are null or undefined', async () => {
        const inspection = makeInspection({
            photos: ['https://example.com/a.jpg'],
        });

        render(
            <InspectionComparisonCard
                inspections={[inspection]}
                pickupVideos={null}
                returnVideos={undefined}
            />,
        );

        const thumb = screen.getByRole('img');
        await userEvent.click(thumb);

        /* only 1 photo slide */
        expect(
            screen.getByTestId('lightbox').getAttribute('data-slides-count'),
        ).toBe('1');
    });
});
