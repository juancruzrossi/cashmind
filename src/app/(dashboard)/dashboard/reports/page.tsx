'use client';

import { useState, useMemo } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

type ChartDataItem = {
  month: string;
  fullMonth: string;
  income: number | null;
  expenses: number | null;
  savings: number;
  savingsRate: number;
};
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank,
  Target,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const AXIS_COLOR = '#9ca3af';
const GRID_COLOR = '#374151';
const INCOME_COLOR = '#34d399';
const EXPENSE_COLOR = '#f87171';
const SAVINGS_COLOR = '#fcd34d';
const EMPTY_BAR_COLOR = '#4b5563';

export default function ReportsPage() {
  const { transactions, payslips, budgets, goals } = useFinanceStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    transactions.forEach((t) => yearsSet.add(new Date(t.date).getFullYear()));
    payslips.forEach((p) => yearsSet.add(p.year));
    yearsSet.add(new Date().getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, payslips]);

  const yearTransactions = useMemo(() => {
    return transactions.filter((t) => {
      return new Date(t.date).getFullYear() === parseInt(selectedYear);
    });
  }, [transactions, selectedYear]);

  const monthlyData = useMemo(() => {
    const data = MONTHS.map((month, index) => {
      const monthTransactions = yearTransactions.filter((t) => {
        return new Date(t.date).getMonth() === index;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: month.slice(0, 3),
        fullMonth: month,
        income,
        expenses,
        savings: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      };
    });

    return data;
  }, [yearTransactions]);

  const categoryData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};

    yearTransactions.forEach((t) => {
      if (t.type === 'expense') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      } else {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      }
    });

    const expenses = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        label: EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category,
        amount,
        color: CATEGORY_COLORS[category] || '#6B7280',
      }))
      .sort((a, b) => b.amount - a.amount);

    const income = Object.entries(incomeByCategory)
      .map(([category, amount]) => ({
        category,
        label: INCOME_CATEGORIES.find((c) => c.value === category)?.label || category,
        amount,
        color: CATEGORY_COLORS[category] || '#6B7280',
      }))
      .sort((a, b) => b.amount - a.amount);

    return { expenses, income };
  }, [yearTransactions]);

  const summaryStats = useMemo(() => {
    const totalIncome = yearTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = yearTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const avgMonthlyIncome = totalIncome / 12;
    const avgMonthlyExpenses = totalExpenses / 12;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const yearPayslips = payslips.filter((p) => p.year === parseInt(selectedYear));
    const avgGrossSalary = yearPayslips.length > 0
      ? yearPayslips.reduce((sum, p) => sum + p.grossSalary, 0) / yearPayslips.length
      : 0;
    const avgNetSalary = yearPayslips.length > 0
      ? yearPayslips.reduce((sum, p) => sum + p.netSalary, 0) / yearPayslips.length
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      savingsRate,
      avgGrossSalary,
      avgNetSalary,
      payslipsCount: yearPayslips.length,
      transactionsCount: yearTransactions.length,
    };
  }, [yearTransactions, payslips, selectedYear]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de tus finanzas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(summaryStats.totalIncome)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(summaryStats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance Neto</p>
                <p className={`text-2xl font-bold ${summaryStats.netBalance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {formatCurrency(summaryStats.netBalance)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <PiggyBank className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Ahorro</p>
                <p className={`text-2xl font-bold ${summaryStats.savingsRate >= 20 ? 'text-emerald-500' : summaryStats.savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                  {summaryStats.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-chart-3/20">
                <Target className="w-5 h-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Evolución mensual durante {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.map(item => ({
                      ...item,
                      income: item.income > 0 ? item.income : null,
                      expenses: item.expenses > 0 ? item.expenses : null,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        axisLine={{ stroke: GRID_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(value) => <span style={{ color: AXIS_COLOR }}>{value}</span>} />
                      <Bar dataKey="income" name="Ingresos" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Gastos" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Tendencia de Ahorro</CardTitle>
                <CardDescription>Ahorro mensual acumulado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="savingsGradientReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        axisLine={{ stroke: GRID_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="Ahorro"
                        stroke={INCOME_COLOR}
                        strokeWidth={2}
                        fill="url(#savingsGradientReport)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 glass">
            <CardHeader>
              <CardTitle>Tasa de Ahorro Mensual</CardTitle>
              <CardDescription>Porcentaje de ingresos ahorrados cada mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                      axisLine={{ stroke: GRID_COLOR }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}%`}
                      domain={[-50, 100]}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Tasa de Ahorro']}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savingsRate"
                      name="Tasa de Ahorro"
                      stroke={SAVINGS_COLOR}
                      strokeWidth={2}
                      dot={{ fill: SAVINGS_COLOR }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Distribución de Gastos</CardTitle>
                <CardDescription>Por categoría durante {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.expenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="label"
                      >
                        {categoryData.expenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e5e7eb',
                        }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Top Categorías de Gasto</CardTitle>
                <CardDescription>Las 10 principales categorías</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.expenses.slice(0, 10).map((item, index) => {
                    const total = categoryData.expenses.reduce((sum, i) => sum + i.amount, 0);
                    const percentage = (item.amount / total) * 100;

                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                            <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Fuentes de Ingreso</CardTitle>
                <CardDescription>Distribución por categoría durante {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.income}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="label"
                      >
                        {categoryData.income.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e5e7eb',
                        }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle>Desglose de Ingresos</CardTitle>
                <CardDescription>Por fuente de ingreso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.income.map((item) => {
                    const total = categoryData.income.reduce((sum, i) => sum + i.amount, 0);
                    const percentage = total > 0 ? (item.amount / total) * 100 : 0;

                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                            <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {summaryStats.payslipsCount > 0 && (
            <Card className="border-border/50 glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Resumen de Recibos de Sueldo
                </CardTitle>
                <CardDescription>Estadísticas de {summaryStats.payslipsCount} recibos analizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Salario Bruto Promedio</p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {formatCurrency(summaryStats.avgGrossSalary)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Salario Neto Promedio</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(summaryStats.avgNetSalary)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Deducciones Promedio</p>
                    <p className="text-2xl font-bold text-red-500">
                      {formatCurrency(summaryStats.avgGrossSalary - summaryStats.avgNetSalary)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({((1 - summaryStats.avgNetSalary / summaryStats.avgGrossSalary) * 100).toFixed(1)}% del bruto)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
