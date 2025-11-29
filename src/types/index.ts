export interface User {
  id: string;
  username: string;
}

export interface PayslipData {
  id: string;
  month: string;
  year: number;
  uploadDate: string;
  fileName: string;
  grossSalary: number;
  netSalary: number;
  deductions: Deduction[];
  bonuses: Bonus[];
  employer?: string;
  position?: string;
  rawText?: string;
}

export interface Deduction {
  name: string;
  amount: number;
  percentage?: number;
  category: 'tax' | 'social_security' | 'retirement' | 'health' | 'other';
}

export interface Bonus {
  name: string;
  amount: number;
  type: 'regular' | 'performance' | 'holiday' | 'other';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color?: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: 'savings' | 'investment' | 'debt' | 'purchase' | 'emergency' | 'other';
  icon?: string;
  color?: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  monthlyAvgIncome: number;
  monthlyAvgExpenses: number;
  topExpenseCategory: string;
  budgetUtilization: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Vivienda', icon: 'Home' },
  { value: 'transportation', label: 'Transporte', icon: 'Car' },
  { value: 'food', label: 'Alimentación', icon: 'UtensilsCrossed' },
  { value: 'utilities', label: 'Servicios', icon: 'Zap' },
  { value: 'healthcare', label: 'Salud', icon: 'Heart' },
  { value: 'entertainment', label: 'Entretenimiento', icon: 'Film' },
  { value: 'shopping', label: 'Compras', icon: 'ShoppingBag' },
  { value: 'education', label: 'Educación', icon: 'GraduationCap' },
  { value: 'personal', label: 'Personal', icon: 'User' },
  { value: 'savings', label: 'Ahorro', icon: 'PiggyBank' },
  { value: 'investments', label: 'Inversiones', icon: 'TrendingUp' },
  { value: 'debt', label: 'Deudas', icon: 'CreditCard' },
  { value: 'other', label: 'Otros', icon: 'MoreHorizontal' },
] as const;

export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salario', icon: 'Briefcase' },
  { value: 'freelance', label: 'Freelance', icon: 'Laptop' },
  { value: 'investments', label: 'Inversiones', icon: 'TrendingUp' },
  { value: 'rental', label: 'Alquiler', icon: 'Building' },
  { value: 'bonus', label: 'Bonus', icon: 'Gift' },
  { value: 'refund', label: 'Reembolso', icon: 'RotateCcw' },
  { value: 'other', label: 'Otros', icon: 'MoreHorizontal' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  housing: '#10B981',
  transportation: '#3B82F6',
  food: '#F59E0B',
  utilities: '#8B5CF6',
  healthcare: '#EF4444',
  entertainment: '#EC4899',
  shopping: '#14B8A6',
  education: '#6366F1',
  personal: '#F97316',
  savings: '#22C55E',
  investments: '#06B6D4',
  debt: '#DC2626',
  other: '#6B7280',
  salary: '#10B981',
  freelance: '#3B82F6',
  rental: '#8B5CF6',
  bonus: '#F59E0B',
  refund: '#14B8A6',
};
