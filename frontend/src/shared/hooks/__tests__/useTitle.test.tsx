import { render } from '@testing-library/react';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useTitle } from '../useTitle';

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useGeneralSettings: () => ({
        data: { data: { site_name: 'Swiftflitz Test' } },
    }),
}));

/** Minimal component that renders the element returned by useTitle. */
function TitleFixture({ page }: { page: string }) {
    return useTitle(page);
}

describe('useTitle', () => {
    afterEach(() => {
        document.title = '';
    });

    it('sets "PageTitle | SiteName" when a page title is provided', () => {
        render(
            <HelmetProvider>
                <TitleFixture page="Dashboard" />
            </HelmetProvider>
        );
        expect(document.title).toBe('Dashboard | Swiftflitz Test');
    });

    it('sets just the site name when pageTitle is empty', () => {
        render(
            <HelmetProvider>
                <TitleFixture page="" />
            </HelmetProvider>
        );
        expect(document.title).toBe('Swiftflitz Test');
    });

    it('sets the correct title for a different page', () => {
        const { container } = render(
            <HelmetProvider>
                <TitleFixture page="About" />
            </HelmetProvider>
        );
        expect(container).toBeDefined();
        expect(document.title).toBe('About | Swiftflitz Test');
    });
});
