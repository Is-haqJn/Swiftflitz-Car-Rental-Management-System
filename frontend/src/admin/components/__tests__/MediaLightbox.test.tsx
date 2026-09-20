import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

vi.mock('yet-another-react-lightbox', () => ({
    default: ({ open, close, slides }: { open: boolean; close: () => void; slides: unknown[] }) =>
        open ? (
            <div data-testid="lightbox" data-slides-count={slides?.length ?? 0}>
                <button data-testid="lightbox-close" onClick={close}>
                    Close
                </button>
            </div>
        ) : null,
}));

vi.mock('yet-another-react-lightbox/plugins/video', () => ({
    default: { augmentation: () => ({}) },
}));

import MediaLightbox from '../MediaLightbox';

describe('MediaLightbox', () => {
    it('renders nothing when open=false', () => {
        render(
            <MediaLightbox
                open={false}
                slides={[{ type: 'image', src: 'https://example.com/photo.jpg' }]}
                onClose={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('lightbox')).toBeNull();
    });

    it('renders image slide for type=image', () => {
        render(
            <MediaLightbox
                open={true}
                slides={[{ type: 'image', src: 'https://example.com/photo.jpg' }]}
                onClose={vi.fn()}
            />,
        );

        expect(screen.getByTestId('lightbox')).toBeDefined();
        expect(screen.getByTestId('lightbox').getAttribute('data-slides-count')).toBe('1');
    });

    it('renders video slide with native controls for type=video', () => {
        render(
            <MediaLightbox
                open={true}
                slides={[
                    {
                        type: 'video',
                        src: 'https://example.com/video.mp4',
                        mimeType: 'video/mp4',
                    },
                ]}
                onClose={vi.fn()}
            />,
        );

        expect(screen.getByTestId('lightbox')).toBeDefined();
        expect(screen.getByTestId('lightbox').getAttribute('data-slides-count')).toBe('1');
    });

    it('calls onClose when close callback invoked', async () => {
        const onClose = vi.fn();
        render(
            <MediaLightbox
                open={true}
                slides={[{ type: 'image', src: 'https://example.com/photo.jpg' }]}
                onClose={onClose}
            />,
        );

        await userEvent.click(screen.getByTestId('lightbox-close'));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('renders all slides when multiple provided', () => {
        render(
            <MediaLightbox
                open={true}
                slides={[
                    { type: 'image', src: 'https://example.com/a.jpg' },
                    { type: 'image', src: 'https://example.com/b.jpg' },
                    { type: 'video', src: 'https://example.com/c.mp4' },
                ]}
                onClose={vi.fn()}
            />,
        );

        expect(screen.getByTestId('lightbox').getAttribute('data-slides-count')).toBe('3');
    });
});
