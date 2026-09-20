import { describe, it, expect } from 'vitest';
import {
    formatChannelLabel,
    getChannelVariant,
} from '@/shared/types/transaction.types';

describe('formatChannelLabel', () => {
    it('returns known label for known channels', () => {
        expect(formatChannelLabel('momo')).toBe('Mobile Money');
        expect(formatChannelLabel('card')).toBe('Card');
        expect(formatChannelLabel('cash')).toBe('Cash');
        expect(formatChannelLabel('bank_transfer')).toBe('Bank Transfer');
        expect(formatChannelLabel('online')).toBe('Online');
        expect(formatChannelLabel('manual')).toBe('Manual Payment');
    });

    it('title-cases unknown future channels with underscores', () => {
        expect(formatChannelLabel('bank_transfer_new')).toBe(
            'Bank Transfer New'
        );
        expect(formatChannelLabel('wallet_pay')).toBe('Wallet Pay');
        expect(formatChannelLabel('ussd')).toBe('Ussd');
    });

    it('title-cases unknown future channels with dashes', () => {
        expect(formatChannelLabel('qr-code')).toBe('Qr Code');
        expect(formatChannelLabel('pay-later')).toBe('Pay Later');
    });

    it('returns dash for null, undefined, and empty string', () => {
        expect(formatChannelLabel(null)).toBe('-');
        expect(formatChannelLabel(undefined)).toBe('-');
        expect(formatChannelLabel('')).toBe('-');
    });
});

describe('getChannelVariant', () => {
    it('returns correct Bootstrap variant for known channels', () => {
        expect(getChannelVariant('momo')).toBe('warning');
        expect(getChannelVariant('card')).toBe('primary');
        expect(getChannelVariant('cash')).toBe('success');
        expect(getChannelVariant('bank_transfer')).toBe('info');
        expect(getChannelVariant('online')).toBe('secondary');
        expect(getChannelVariant('manual')).toBe('dark');
    });

    it('returns secondary for unknown channels', () => {
        expect(getChannelVariant('ussd')).toBe('secondary');
        expect(getChannelVariant('qr_code')).toBe('secondary');
    });

    it('returns secondary for null, undefined, and empty string', () => {
        expect(getChannelVariant(null)).toBe('secondary');
        expect(getChannelVariant(undefined)).toBe('secondary');
        expect(getChannelVariant('')).toBe('secondary');
    });
});
