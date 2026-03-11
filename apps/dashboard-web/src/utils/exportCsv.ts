/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * @param filename  - e.g. 'sessions-2026-03-10.csv'
 * @param rows      - array of plain objects; keys become column headers
 */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => {
                const val = row[h] ?? '';
                const str = String(val);
                // Wrap in quotes if value contains comma, quote, or newline
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(',')
        ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** Format a Date as YYYY-MM-DD */
export function toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

/** Today as YYYY-MM-DD */
export function today(): string {
    return toIsoDate(new Date());
}

/** N days ago as YYYY-MM-DD */
export function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toIsoDate(d);
}
