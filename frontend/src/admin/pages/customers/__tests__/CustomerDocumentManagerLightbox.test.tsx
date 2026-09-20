import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/hooks/queries/useCustomers', () => ({
    useCustomer: vi.fn(),
    useDeleteCustomerDocument: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
    })),
    customerKeys: {
        detail: (id: string) => ['customers', id],
    },
}));

vi.mock('@/shared/hooks/useTusMultiUpload', () => ({
    useTusMultiUpload: vi.fn(() => ({
        addFiles: vi.fn(),
        clearAll: vi.fn(),
        files: [],
        allSucceeded: false,
    })),
}));

vi.mock('@/shared/components/ui/TusUploadToast', () => ({
    default: () => null,
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn(),
    })),
}));

/*
 * Mock MediaLightbox - the component will import from @adminComponents/MediaLightbox
 * after implementation.
 * FAILS before implementation: CustomerDocumentManager does not render MediaLightbox at all.
 */
vi.mock('@adminComponents/MediaLightbox', () => ({
    default: ({
        open,
        index,
        onClose,
        slides,
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
            data-slides-count={String(slides.length)}
            onClick={onClose}
        />
    ),
}));

import { useCustomer } from '@/shared/hooks/queries/useCustomers';
import CustomerDocumentManager from '../CustomerDocumentManager';

const mockCustomer = {
    id: 'cust-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+233200000000',
    profile_status: 'verified',
    license_images: [
        {
            id: 1,
            collection: 'license',
            file_name: 'license-front.jpg',
            urls: {
                thumb: 'https://example.com/license1-thumb.jpg',
                original: 'https://example.com/license1-original.jpg',
                large: 'https://example.com/license1-large.jpg',
                medium: 'https://example.com/license1-medium.jpg',
            },
        },
        {
            id: 2,
            collection: 'license',
            file_name: 'license-back.jpg',
            urls: {
                thumb: 'https://example.com/license2-thumb.jpg',
                original: 'https://example.com/license2-original.jpg',
                large: 'https://example.com/license2-large.jpg',
                medium: 'https://example.com/license2-medium.jpg',
            },
        },
    ],
    id_document_images: [],
    documents: [],
};

describe('CustomerDocumentManager - Lightbox (Sprint I)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCustomer).mockReturnValue({
            data: { data: mockCustomer },
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useCustomer>);
    });

    it('renders MediaLightbox for license section initially closed', () => {
        render(<CustomerDocumentManager customerId="cust-1" />);

        /*
         * FAILS before implementation: CustomerDocumentManager does not
         * import or render MediaLightbox - getByTestId will throw.
         */
        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'false');
    });

    it('opens lightbox when clicking first license document thumbnail', () => {
        render(<CustomerDocumentManager customerId="cust-1" />);

        /*
         * FAILS before implementation: no lightbox rendered, and no onClick
         * handler on document thumbnails.
         */
        const thumbnails = screen.getAllByAltText('license-front.jpg');
        fireEvent.click(thumbnails[0]);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');
        expect(lightbox).toHaveAttribute('data-index', '0');
    });

    it('opens lightbox at correct index when clicking second license thumbnail', () => {
        render(<CustomerDocumentManager customerId="cust-1" />);

        /*
         * FAILS before implementation: no lightbox, no indexed onClick on thumbnails.
         */
        const secondThumbnail = screen.getByAltText('license-back.jpg');
        fireEvent.click(secondThumbnail);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');
        expect(lightbox).toHaveAttribute('data-index', '1');
    });

    it('provides all license slides to the lightbox', () => {
        render(<CustomerDocumentManager customerId="cust-1" />);

        /*
         * FAILS before implementation: lightbox not present at all.
         */
        const firstThumbnail = screen.getByAltText('license-front.jpg');
        fireEvent.click(firstThumbnail);

        /* After implementation, all license images are slides in the lightbox */
        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-slides-count',
            '2'
        );
    });

    it('closes lightbox when onClose is called', () => {
        render(<CustomerDocumentManager customerId="cust-1" />);

        /*
         * FAILS before implementation: no lightbox rendered.
         */
        const firstThumbnail = screen.getByAltText('license-front.jpg');
        fireEvent.click(firstThumbnail);

        const lightbox = screen.getByTestId('media-lightbox');
        expect(lightbox).toHaveAttribute('data-open', 'true');

        fireEvent.click(lightbox);
        expect(screen.getByTestId('media-lightbox')).toHaveAttribute(
            'data-open',
            'false'
        );
    });
});
