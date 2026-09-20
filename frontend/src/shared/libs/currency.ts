import { formatCurrency } from './utils';

export interface PriceDisplay {
    primary: string;
    secondary: string | null;
}

export function formatWithSymbol(
    amount: number,
    symbol: string,
    compact = false
): string {
    const hasMeaningfulDecimals =
        amount % 1 !== 0 && Math.round((amount % 1) * 100) !== 0;
    const fractionDigits = compact && !hasMeaningfulDecimals ? 0 : 2;
    const formatted = new Intl.NumberFormat('en-GH', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: 2,
    }).format(amount);
    return `${symbol}${formatted}`;
}

export function formatPriceWithConversion(
    amount: number,
    branchCurrencyCode: string,
    exchangeRate: number | null | undefined,
    globalCurrencyCode: string,
    showConverted: boolean,
    branchCurrencySymbol?: string | null,
    globalCurrencySymbol?: string | null,
    compact = false
): PriceDisplay {
    const isCustomCurrency = branchCurrencyCode !== globalCurrencyCode;

    let primary: string;
    if (isCustomCurrency && branchCurrencySymbol) {
        primary = formatWithSymbol(amount, branchCurrencySymbol, compact);
    } else if (compact && globalCurrencySymbol) {
        primary = formatWithSymbol(amount, globalCurrencySymbol, compact);
    } else {
        primary = formatCurrency(amount, branchCurrencyCode);
    }

    if (
        !showConverted ||
        !exchangeRate ||
        exchangeRate === 1 ||
        branchCurrencyCode === globalCurrencyCode
    ) {
        return { primary, secondary: null };
    }

    const globalAmount = Math.round(amount * exchangeRate * 100) / 100;
    const secondary = globalCurrencySymbol
        ? formatWithSymbol(globalAmount, globalCurrencySymbol, compact)
        : formatCurrency(globalAmount, globalCurrencyCode);
    return { primary, secondary };
}
