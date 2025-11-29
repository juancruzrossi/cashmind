'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { MonthlyData, CategoryBreakdown } from '@/types';

interface IncomeExpenseChartProps {
  data: MonthlyData[];
}

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
  title: string;
  description?: string;
}

interface SavingsChartProps {
  data: MonthlyData[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const AXIS_COLOR = '#9ca3af';
const GRID_COLOR = '#374151';
const INCOME_COLOR = '#34d399';
const EXPENSE_COLOR = '#f87171';
const EMPTY_BAR_COLOR = '#4b5563';

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

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const hasData = data.some(item => item.income > 0 || item.expenses > 0);

  return (
    <Card className="border-border/50 glass h-full">
      <CardHeader>
        <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
        <CardDescription>Evolución mensual de tus finanzas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No hay datos para mostrar</p>
              <p className="text-xs mt-1">Agrega transacciones para ver el gráfico</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span style={{ color: AXIS_COLOR, fontSize: '14px' }}>{value}</span>}
                />
                <Bar
                  dataKey="income"
                  name="Ingresos"
                  fill={INCOME_COLOR}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Gastos"
                  fill={EXPENSE_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryPieChart({ data, title, description }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const CATEGORY_LABELS: Record<string, string> = {
    housing: 'Vivienda',
    transportation: 'Transporte',
    food: 'Alimentación',
    utilities: 'Servicios',
    healthcare: 'Salud',
    entertainment: 'Entretenimiento',
    shopping: 'Compras',
    education: 'Educación',
    personal: 'Personal',
    savings: 'Ahorro',
    investments: 'Inversiones',
    debt: 'Deudas',
    other: 'Otros',
    salary: 'Salario',
    freelance: 'Freelance',
    rental: 'Alquiler',
    bonus: 'Bonus',
    refund: 'Reembolso',
  };

  return (
    <Card className="border-border/50 glass">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CategoryBreakdown;
                    return (
                      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                        <p className="text-sm font-medium text-foreground">
                          {CATEGORY_LABELS[data.category] || data.category}
                        </p>
                        <p className="text-lg font-bold">{formatCurrency(data.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.percentage.toFixed(1)}% del total
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  {CATEGORY_LABELS[item.category] || item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(item.amount)}</span>
                <span className="text-muted-foreground text-xs">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SavingsChart({ data }: SavingsChartProps) {
  const hasData = data.some(item => item.income > 0 || item.expenses > 0);

  return (
    <Card className="border-border/50 glass">
      <CardHeader>
        <CardTitle className="text-lg">Tendencia de Ahorro</CardTitle>
        <CardDescription>Evolución de tus ahorros mensuales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No hay datos para mostrar</p>
              <p className="text-xs mt-1">Agrega transacciones para ver el gráfico</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#savingsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PayslipChartData {
  month: string;
  grossSalary: number;
  netSalary: number;
}

interface PayslipChartProps {
  data: PayslipChartData[];
}

export function PayslipChart({ data }: PayslipChartProps) {
  const hasData = data.length > 0;

  return (
    <Card className="border-border/50 glass">
      <CardHeader>
        <CardTitle className="text-lg">Evolución Salarial</CardTitle>
        <CardDescription>Historial de recibos de sueldo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No hay recibos cargados</p>
              <p className="text-xs mt-1">Sube recibos para ver la evolución</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
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
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span style={{ color: AXIS_COLOR, fontSize: '14px' }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="grossSalary"
                  name="Bruto"
                  stroke={INCOME_COLOR}
                  strokeWidth={2}
                  fill="url(#grossGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="netSalary"
                  name="Neto"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="url(#netGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
