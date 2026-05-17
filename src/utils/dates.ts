export type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({ date, isCurrentMonth: date.getMonth() === month });
  }
  return cells;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

export function formatDate(date: Date): string {
  const dow = DAY_NAMES[date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日(${dow})`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
