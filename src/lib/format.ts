const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonthYear(value: string): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) return `${MONTHS[monthIdx]} ${year}`;
  }
  return value;
}

export function dateRange(start: string, end: string, current: boolean): string {
  const s = formatMonthYear(start);
  const e = current ? 'Present' : formatMonthYear(end);
  if (!s && !e) return '';
  if (!e) return s;
  if (!s) return e;
  return `${s} — ${e}`;
}

export function joinNonEmpty(parts: Array<string | undefined | null>, sep = ' • '): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(sep);
}
