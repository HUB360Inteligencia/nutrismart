/**
 * Returns a date as YYYY-MM-DD string using the LOCAL timezone.
 * 
 * CRITICAL: Do NOT use `new Date().toISOString().split('T')[0]` — 
 * that returns UTC date which causes data to "disappear" for users
 * in negative UTC offsets (e.g., BRT/UTC-3: after 21h local, 
 * toISOString() returns the NEXT day, causing a date mismatch).
 * 
 * @param date - Optional Date object. Defaults to now.
 * @returns YYYY-MM-DD string in local timezone
 */
export function getLocalDateString(date?: Date): string {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
