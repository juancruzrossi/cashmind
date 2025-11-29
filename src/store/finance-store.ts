import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, PayslipData, Budget, Goal, DashboardStats, MonthlyData, CategoryBreakdown } from '@/types';
import { CATEGORY_COLORS } from '@/types';

interface FinanceState {
  transactions: Transaction[];
  payslips: PayslipData[];
  budgets: Budget[];
  goals: Goal[];

  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addPayslip: (payslip: PayslipData) => void;
  updatePayslip: (id: string, payslip: Partial<PayslipData>) => void;
  deletePayslip: (id: string) => void;

  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  getDashboardStats: () => DashboardStats;
  getMonthlyData: (months?: number) => MonthlyData[];
  getCategoryBreakdown: (type: 'income' | 'expense') => CategoryBreakdown[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      payslips: [],
      budgets: [],
      goals: [],

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addPayslip: (payslip) =>
        set((state) => ({
          payslips: [payslip, ...state.payslips],
        })),

      updatePayslip: (id, updates) =>
        set((state) => ({
          payslips: state.payslips.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePayslip: (id) =>
        set((state) => ({
          payslips: state.payslips.filter((p) => p.id !== id),
        })),

      addBudget: (budget) =>
        set((state) => ({
          budgets: [...state.budgets, budget],
        })),

      updateBudget: (id, updates) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      deleteBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        })),

      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, goal],
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      contributeToGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g
          ),
        })),

      getDashboardStats: () => {
        const { transactions, budgets } = get();
        const now = new Date();
        const currentYear = now.getFullYear();

        const yearTransactions = transactions.filter((t) => {
          const date = new Date(t.date);
          return date.getFullYear() === currentYear;
        });

        const totalIncome = yearTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = yearTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const netBalance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        const monthsWithData = new Set(
          yearTransactions.map((t) => new Date(t.date).getMonth())
        ).size || 1;

        const monthlyAvgIncome = totalIncome / monthsWithData;
        const monthlyAvgExpenses = totalExpenses / monthsWithData;

        const expensesByCategory = yearTransactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        const topExpenseCategory = Object.entries(expensesByCategory)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

        const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
        const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
        const budgetUtilization = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

        return {
          totalIncome,
          totalExpenses,
          netBalance,
          savingsRate,
          monthlyAvgIncome,
          monthlyAvgExpenses,
          topExpenseCategory,
          budgetUtilization,
        };
      },

      getMonthlyData: (months = 12) => {
        const { transactions } = get();
        const result: MonthlyData[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });

          const monthTransactions = transactions.filter((t) => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
          });

          const income = monthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const expenses = monthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          result.push({
            month: monthStr,
            income,
            expenses,
            savings: income - expenses,
          });
        }

        return result;
      },

      getCategoryBreakdown: (type) => {
        const { transactions } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthTransactions = transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            t.type === type &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        });

        const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

        const byCategory = monthTransactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(byCategory)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            color: CATEGORY_COLORS[category] || '#6B7280',
          }))
          .sort((a, b) => b.amount - a.amount);
      },

      getRecentTransactions: (limit = 10) => {
        const { transactions } = get();
        return [...transactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'cashmind-storage',
    }
  )
);
