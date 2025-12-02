/**
 * Date utilities that respect user's local timezone
 */

/**
 * Format a date as YYYY-MM-DD in local timezone (NOT UTC)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date at start of day in local timezone
 */
export function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get the first day of the current month in local timezone
 */
export function getLocalMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of a month in local timezone
 */
export function getLocalMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the current year in local timezone
 */
export function getLocalYearStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Subtract days from a date, respecting local timezone
 */
export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Get user's locale from navigator or fallback to 'es-AR'
 */
export function getUserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'es-AR';
  }
  return 'es-AR';
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date for display using user's locale
 */
export function formatDisplayDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const locale = getUserLocale();
  return d.toLocaleDateString(locale, options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format currency using user's locale
 */
export function formatCurrency(value: number, currency = 'ARS'): string {
  const locale = getUserLocale();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse a date string (YYYY-MM-DD) as local date (not UTC)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
