'use client';

import { useFinanceStore } from '@/store/finance-store';
import { StatCard } from '@/components/dashboard/stat-card';
import { IncomeExpenseChart, CategoryPieChart, SavingsChart, PayslipChart } from '@/components/dashboard/charts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  Target,
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DashboardPage() {
  const {
    getDashboardStats,
    getMonthlyData,
    getCategoryBreakdown,
    getRecentTransactions,
    payslips,
    goals,
  } = useFinanceStore();

  const stats = getDashboardStats();
  const monthlyData = getMonthlyData(6);
  const expenseBreakdown = getCategoryBreakdown('expense');
  const incomeBreakdown = getCategoryBreakdown('income');
  const recentTransactions = getRecentTransactions(8);

  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;
  const goalsProgress = goals.length > 0
    ? (goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / goals.length)
    : 0;

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
      grossSalary: p.grossSalary,
      netSalary: p.netSalary,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen de tus finanzas personales
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Neto"
          value={formatCurrency(stats.netBalance)}
          subtitle="Este año"
          icon={Wallet}
          variant={stats.netBalance >= 0 ? 'success' : 'danger'}
          trend={stats.savingsRate}
          trendLabel="tasa de ahorro"
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats.totalIncome)}
          subtitle={`Promedio: ${formatCurrency(stats.monthlyAvgIncome)}/mes`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Gastos Totales"
          value={formatCurrency(stats.totalExpenses)}
          subtitle={`Promedio: ${formatCurrency(stats.monthlyAvgExpenses)}/mes`}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Tasa de Ahorro"
          value={`${stats.savingsRate.toFixed(1)}%`}
          subtitle="De tus ingresos"
          icon={PiggyBank}
          variant={stats.savingsRate >= 20 ? 'success' : stats.savingsRate >= 10 ? 'warning' : 'danger'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Recibos Analizados"
          value={payslips.length}
          subtitle="Total cargados"
          icon={Receipt}
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
          value={`${stats.budgetUtilization.toFixed(0)}%`}
          subtitle="Del total asignado"
          icon={PiggyBank}
          variant={stats.budgetUtilization <= 80 ? 'success' : stats.budgetUtilization <= 100 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Mayor Gasto"
          value={stats.topExpenseCategory !== 'N/A' ? stats.topExpenseCategory : '-'}
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
          data={expenseBreakdown}
          title="Gastos por Categoría"
          description="Distribución del mes actual"
        />
        <CategoryPieChart
          data={incomeBreakdown}
          title="Ingresos por Categoría"
          description="Fuentes de ingreso del mes"
        />
        <RecentTransactions transactions={recentTransactions} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SavingsChart data={monthlyData} />
        <PayslipChart data={payslipChartData} />
      </div>
    </div>
  );
}
