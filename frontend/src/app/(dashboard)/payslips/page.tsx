'use client';

import { useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePayslips } from '@/hooks/usePayslips';
import { PayslipUploader } from '@/components/payslip/payslip-uploader';
import { PeriodFilter, PeriodValue, getDateRange } from '@/components/dashboard/period-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  FileText,
  MoreHorizontal,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Calendar,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface Payslip {
  id: number;
  month: string;
  year: number;
  upload_date: string;
  gross_salary: number;
  net_salary: number;
  employer?: string;
  position?: string;
  deductions: Array<{
    id: number;
    name: string;
    amount: number;
    percentage?: number;
    category: string;
  }>;
  bonuses: Array<{
    id: number;
    name: string;
    amount: number;
    type: string;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const CATEGORY_LABELS: Record<string, string> = {
  tax: 'Impuestos',
  social_security: 'Seg. Social',
  retirement: 'Jubilación',
  health: 'Salud',
  other: 'Otros',
};

function PayslipsPage() {
  const searchParams = useSearchParams();
  const { payslips, deletePayslip, isLoading, fetchPayslips } = usePayslips();

  const [isUploaderOpen, setIsUploaderOpen] = useState(searchParams.get('upload') === 'true');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [period, setPeriod] = useState<PeriodValue>({ type: 'current_month' });
  const { startDate, endDate } = getDateRange(period);

  const MONTH_ORDER: Record<string, number> = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };

  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const monthNum = MONTH_ORDER[p.month.toLowerCase()] || 1;
      const payslipDate = new Date(p.year, monthNum - 1, 15);
      return payslipDate >= new Date(startDate) && payslipDate <= new Date(endDate);
    });
  }, [payslips, startDate, endDate]);

  const sortedPayslips = [...filteredPayslips].sort((a, b) => {
    const monthA = MONTH_ORDER[a.month.toLowerCase()] || 0;
    const monthB = MONTH_ORDER[b.month.toLowerCase()] || 0;

    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return monthB - monthA;
  });

  const totalGross = filteredPayslips.reduce((sum, p) => sum + Number(p.gross_salary), 0);
  const totalNet = filteredPayslips.reduce((sum, p) => sum + Number(p.net_salary), 0);
  const totalDeductions = totalGross - totalNet;
  const avgDeductionRate = totalGross > 0 ? ((totalDeductions / totalGross) * 100) : 0;

  // Calculate salary variation data (chronologically sorted for the chart)
  const chronologicalPayslips = [...filteredPayslips].sort((a, b) => {
    const monthA = MONTH_ORDER[a.month.toLowerCase()] || 0;
    const monthB = MONTH_ORDER[b.month.toLowerCase()] || 0;
    if (a.year !== b.year) return a.year - b.year;
    return monthA - monthB;
  });

  const salaryVariationData = chronologicalPayslips.map((payslip, index) => {
    const currentNet = Number(payslip.net_salary);
    const prevNet = index > 0 ? Number(chronologicalPayslips[index - 1].net_salary) : currentNet;
    const variation = index > 0 ? ((currentNet - prevNet) / prevNet) * 100 : 0;
    const monthShort = payslip.month.substring(0, 3).charAt(0).toUpperCase() + payslip.month.substring(1, 3).toLowerCase();

    return {
      month: `${monthShort} ${payslip.year.toString().slice(-2)}`,
      variation: Number(variation.toFixed(1)),
      salary: currentNet,
    };
  });

  const totalVariation = salaryVariationData.length > 1
    ? Number((((salaryVariationData[salaryVariationData.length - 1].salary - salaryVariationData[0].salary) / salaryVariationData[0].salary) * 100).toFixed(1))
    : 0;

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este recibo?')) {
      await deletePayslip(id);
    }
  };

  const handleUploaderClose = (open: boolean) => {
    setIsUploaderOpen(open);
    if (!open) {
      fetchPayslips();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recibos de Sueldo</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Analiza y gestiona tus recibos con IA
            </p>
          </div>
          <Button
            onClick={() => setIsUploaderOpen(true)}
            className="bg-gradient-to-r from-primary to-chart-2 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Recibo
          </Button>
        </div>
        <div className="flex justify-start sm:justify-end">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recibos</p>
                <p className="text-2xl font-bold">{filteredPayslips.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Total Bruto</p>
                <p className="text-lg sm:text-xl font-bold text-foreground truncate">{formatCurrency(totalGross)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] shrink-0">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Total Neto</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400 truncate">{formatCurrency(totalNet)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa Deducción</p>
                <p className="text-2xl font-bold text-red-400">{avgDeductionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Variation Chart */}
      {salaryVariationData.length > 1 && (
        <Card className="border-border/50 glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Variación Salarial</CardTitle>
                <CardDescription>Evolución del salario neto en el período</CardDescription>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                totalVariation > 0 && "bg-emerald-500/20 text-emerald-500",
                totalVariation < 0 && "bg-red-500/20 text-red-500",
                totalVariation === 0 && "bg-muted text-muted-foreground"
              )}>
                {totalVariation > 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : totalVariation < 0 ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <Minus className="w-5 h-5" />
                )}
                <span className="text-xl font-bold">
                  {totalVariation > 0 ? '+' : ''}{totalVariation}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryVariationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="variationGradientPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.18 165)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.75 0.18 165)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="variationGradientNegative" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="5%" stopColor="oklch(0.70 0.12 15)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.70 0.12 15)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.65 0.02 260)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.65 0.02 260)', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="glass rounded-lg p-3 shadow-lg border border-border/50">
                            <p className="text-sm font-medium">{data.month}</p>
                            <p className={cn(
                              "text-lg font-bold",
                              data.variation > 0 ? "text-emerald-500" : data.variation < 0 ? "text-red-500" : "text-muted-foreground"
                            )}>
                              {data.variation > 0 ? '+' : ''}{data.variation}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Neto: {formatCurrency(data.salary)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={0} stroke="oklch(0.40 0.02 260)" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="variation"
                    stroke="oklch(0.75 0.18 165)"
                    strokeWidth={2}
                    fill="url(#variationGradientPositive)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 glass">
        <CardHeader>
          <CardTitle>Historial de Recibos</CardTitle>
          <CardDescription>Todos tus recibos analizados</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPayslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No hay recibos</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                Sube tu primer recibo de sueldo y la IA extraerá automáticamente toda la información
              </p>
              <Button
                onClick={() => setIsUploaderOpen(true)}
                className="mt-6"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir Recibo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedPayslips.map((payslip) => (
                <Card
                  key={payslip.id}
                  className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedPayslip(payslip)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{capitalize(payslip.month)} {payslip.year}</p>
                          <p className="text-xs text-muted-foreground">
                            {payslip.employer || 'Empleador no especificado'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayslip(payslip);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(payslip.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Bruto</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(payslip.gross_salary))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Neto</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(Number(payslip.net_salary))}
                        </span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-muted-foreground">Deducciones</span>
                          <span className="text-red-400">
                            {((1 - Number(payslip.net_salary) / Number(payslip.gross_salary)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={(1 - Number(payslip.net_salary) / Number(payslip.gross_salary)) * 100}
                          className="h-1.5 [&>div]:bg-red-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Subido: {formatDate(payslip.upload_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PayslipUploader open={isUploaderOpen} onOpenChange={handleUploaderClose} />

      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedPayslip && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  {capitalize(selectedPayslip.month)} {selectedPayslip.year}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Empleador</span>
                      </div>
                      <p className="font-medium">{selectedPayslip.employer || 'No especificado'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Cargo</span>
                      </div>
                      <p className="font-medium">{selectedPayslip.position || 'No especificado'}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Salario Bruto</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(Number(selectedPayslip.gross_salary))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Salario Neto</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(Number(selectedPayslip.net_salary))}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedPayslip.deductions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      Deducciones
                    </h4>
                    <div className="space-y-2">
                      {selectedPayslip.deductions.map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between items-center p-3 rounded-lg bg-secondary/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{d.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[d.category] || d.category}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium text-red-500">
                            -{formatCurrency(Number(d.amount))}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <span className="font-medium">Total Deducciones</span>
                        <span className="font-bold text-red-500">
                          -{formatCurrency(selectedPayslip.deductions.reduce((sum, d) => sum + Number(d.amount), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayslip.bonuses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Adicionales
                    </h4>
                    <div className="space-y-2">
                      {selectedPayslip.bonuses.map((b) => (
                        <div
                          key={b.id}
                          className="flex justify-between items-center p-3 rounded-lg bg-secondary/30"
                        >
                          <span className="text-sm">{b.name}</span>
                          <span className="text-sm font-medium text-emerald-400">
                            +{formatCurrency(Number(b.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PayslipsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PayslipsPage />
    </Suspense>
  );
}
