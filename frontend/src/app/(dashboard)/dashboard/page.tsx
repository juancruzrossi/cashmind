'use client';

import { useTransactions, useTransactionStats, useMonthlyData, useCategoryBreakdown } from '@/hooks/useTransactions';
import { usePayslips } from '@/hooks/usePayslips';
import { useGoals } from '@/hooks/useGoals';
import { useBudgets } from '@/hooks/useBudgets';
import { StatCard } from '@/components/dashboard/stat-card';
import { IncomeExpenseChart, CategoryPieChart, SavingsChart, PayslipChart } from '@/components/dashboard/charts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowRightLeft,
} from 'lucide-react';
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { useState } from 'react';
import { PeriodFilter, PeriodValue, getDateRange, getPeriodLabel } from '@/components/dashboard/period-filter';

const getCategoryLabel = (category: string): string => {
  const expense = EXPENSE_CATEGORIES.find(c => c.value === category);
  if (expense) return expense.label;
  const income = INCOME_CATEGORIES.find(c => c.value === category);
  if (income) return income.label;
  return category;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>({ type: 'current_year' });
  const { startDate, endDate } = getDateRange(period);

  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { stats, isLoading: statsLoading } = useTransactionStats(startDate, endDate);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyData(startDate, endDate);
  const { data: expenseBreakdown } = useCategoryBreakdown('expense', startDate, endDate);
  const { data: incomeBreakdown } = useCategoryBreakdown('income', startDate, endDate);
  const { payslips, isLoading: payslipsLoading } = usePayslips();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { budgets, isLoading: budgetsLoading } = useBudgets();

  const isLoading = transactionsLoading || statsLoading || monthlyLoading || payslipsLoading || goalsLoading || budgetsLoading;

  const activeGoals = goals.filter(g => g.current_amount < g.target_amount).length;
  const goalsProgress = goals.length > 0
    ? (goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / goals.length)
    : 0;

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.limit), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const budgetUtilization = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  // Filter transactions by selected period
  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const payslipChartData = [...payslips]
    .sort((a, b) => {
      const dateA = new Date(a.year, ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        .findIndex(m => m.toLowerCase() === a.month.toLowerCase()));
      const dateB = new Date(b.year, ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        .findIndex(m => m.toLowerCase() === b.month.toLowerCase()));
      return dateA.getTime() - dateB.getTime();
    })
    .map(p => ({
      month: `${p.month.slice(0, 3)} ${p.year}`,
      grossSalary: Number(p.gross_salary),
      netSalary: Number(p.net_salary),
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Resumen de tus finanzas personales
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Neto"
          value={formatCurrency(stats?.netBalance || 0)}
          subtitle={getPeriodLabel(period)}
          icon={Wallet}
          variant={(stats?.netBalance || 0) >= 0 ? 'success' : 'danger'}
          trend={stats?.savingsRate || 0}
          trendLabel="tasa de ahorro"
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats?.totalIncome || 0)}
          subtitle={getPeriodLabel(period)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Gastos Totales"
          value={formatCurrency(stats?.totalExpenses || 0)}
          subtitle={getPeriodLabel(period)}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Tasa de Ahorro"
          value={`${(stats?.savingsRate || 0).toFixed(1)}%`}
          subtitle="De tus ingresos"
          icon={PiggyBank}
          variant={(stats?.savingsRate || 0) >= 20 ? 'success' : (stats?.savingsRate || 0) >= 10 ? 'warning' : 'danger'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Transacciones"
          value={filteredTransactions.length}
          subtitle="En el período"
          icon={ArrowRightLeft}
          variant="default"
        />
        <StatCard
          title="Metas Activas"
          value={activeGoals}
          subtitle={`${goalsProgress.toFixed(0)}% progreso promedio`}
          icon={Target}
          variant="primary"
        />
        <StatCard
          title="Presupuesto Usado"
          value={`${budgetUtilization.toFixed(0)}%`}
          subtitle="Del total asignado"
          icon={PiggyBank}
          variant={budgetUtilization <= 80 ? 'success' : budgetUtilization <= 100 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Mayor Gasto"
          value={stats?.topExpenseCategory !== 'N/A' ? getCategoryLabel(stats?.topExpenseCategory || '') : '-'}
          subtitle="Categoría principal"
          icon={TrendingDown}
          variant="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={monthlyData} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CategoryPieChart
          data={incomeBreakdown.map(d => ({ ...d, color: CATEGORY_COLORS[d.category] || '#10B981' }))}
          title="Ingresos por Categoría"
          description={`Fuentes de ingreso - ${getPeriodLabel(period)}`}
        />
        <CategoryPieChart
          data={expenseBreakdown.map(d => ({ ...d, color: CATEGORY_COLORS[d.category] || '#6B7280' }))}
          title="Gastos por Categoría"
          description={`Distribución - ${getPeriodLabel(period)}`}
        />
        <RecentTransactions transactions={recentTransactions.map(t => ({
          id: String(t.id),
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          notes: t.notes,
        }))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SavingsChart data={monthlyData} />
        <PayslipChart data={payslipChartData} />
      </div>
    </div>
  );
}
