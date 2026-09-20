const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function shouldShowPopup(
    key: string,
    frequency: 'always' | 'once_per_day'
): boolean {
    if (frequency === 'always') return true;

    const stored = localStorage.getItem(key);
    if (!stored) return true;

    return Date.now() - Number(stored) > ONE_DAY_MS;
}

export function markPopupSeen(key: string): void {
    localStorage.setItem(key, String(Date.now()));
}
