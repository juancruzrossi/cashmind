import type { TransactionData, BudgetData, GoalContributionData } from './types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';

function sanitizeString(str: string, maxLength: number): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function validateTransactionData(data: unknown): TransactionData | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  // Required fields
  if (typeof d.amount !== 'number' || d.amount <= 0 || d.amount > 999999999) {
    return null;
  }

  if (typeof d.description !== 'string' || d.description.length === 0) {
    return null;
  }

  if (!['income', 'expense'].includes(d.type as string)) {
    return null;
  }

  // Sanitize description
  const description = sanitizeString(d.description as string, 255);
  if (description.length === 0) return null;

  // Validate date
  const today = new Date().toISOString().split('T')[0];
  let date = d.date as string;
  if (!date || !isValidDate(date)) {
    date = today;
  }

  // Validate category
  const type = d.type as 'income' | 'expense';
  const validCategories =
    type === 'income'
      ? INCOME_CATEGORIES.map((c) => c.value as string)
      : EXPENSE_CATEGORIES.map((c) => c.value as string);

  let category = (d.category as string) || 'other';
  if (!validCategories.includes(category)) {
    category = 'other';
  }

  return {
    amount: Math.min(d.amount, 999999999),
    description,
    date,
    type,
    category,
    notes: d.notes ? sanitizeString(d.notes as string, 500) : undefined,
  };
}

export function validateBudgetData(data: unknown): BudgetData | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  if (typeof d.name !== 'string' || d.name.length === 0) {
    return null;
  }

  if (typeof d.category !== 'string' || d.category.length === 0) {
    return null;
  }

  if (typeof d.limit !== 'number' || d.limit <= 0 || d.limit > 999999999) {
    return null;
  }

  const validPeriods = ['weekly', 'monthly', 'yearly'];
  let period = (d.period as string) || 'monthly';
  if (!validPeriods.includes(period)) {
    period = 'monthly';
  }

  return {
    name: sanitizeString(d.name as string, 100),
    category: sanitizeString(d.category as string, 50),
    limit: Math.min(d.limit, 999999999),
    period: period as 'weekly' | 'monthly' | 'yearly',
  };
}

export function validateGoalContribution(data: unknown): GoalContributionData | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  if (typeof d.goalId !== 'number' || d.goalId <= 0) {
    return null;
  }

  if (typeof d.amount !== 'number' || d.amount <= 0 || d.amount > 999999999) {
    return null;
  }

  return {
    goalId: d.goalId,
    goalName: typeof d.goalName === 'string' ? sanitizeString(d.goalName, 100) : '',
    amount: Math.min(d.amount, 999999999),
  };
}
