import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock useQuery so useGeneralSettings returns controlled data.
// useFormatCurrency → useCurrency → useGeneralSettings → useQuery
vi.mock('@tanstack/react-query', async importOriginal => {
    const original =
        await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...original,
        useQuery: vi.fn().mockReturnValue({
            data: { data: { currency: 'GHS', site_name: 'Swiftflitz' } },
        }),
    };
});

// useCurrency also calls useAppSelector for branch-level overrides
vi.mock('@/store', () => ({
    useAppSelector: vi.fn(() => null),
}));

import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';

describe('useFormatCurrency', () => {
    it('returns a callable formatter function', () => {
        const { result } = renderHook(() => useFormatCurrency());
        expect(typeof result.current).toBe('function');
    });

    it('formats a positive amount', () => {
        const { result } = renderHook(() => useFormatCurrency());
        const formatted = result.current(100);
        expect(formatted).toContain('100');
    });

    it('formats null as 0.00', () => {
        const { result } = renderHook(() => useFormatCurrency());
        expect(result.current(null)).toContain('0.00');
    });

    it('formats undefined as 0.00', () => {
        const { result } = renderHook(() => useFormatCurrency());
        expect(result.current(undefined)).toContain('0.00');
    });

    it('formats zero as 0.00', () => {
        const { result } = renderHook(() => useFormatCurrency());
        expect(result.current(0)).toContain('0.00');
    });

    it('always includes two decimal places', () => {
        const { result } = renderHook(() => useFormatCurrency());
        expect(result.current(50.5)).toContain('50.50');
    });
});
