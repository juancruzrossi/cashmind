'use client';

import { AlertTriangle, RefreshCw, PiggyBank, Home, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/health/metric-card';

type Status = 'green' | 'yellow' | 'red';

const statusConfig: Record<Status, { color: string; label: string; bgColor: string }> = {
  green: {
    color: '#22c55e',
    label: 'Excelente',
    bgColor: 'bg-emerald-500/10',
  },
  yellow: {
    color: '#eab308',
    label: 'Regular',
    bgColor: 'bg-yellow-500/10',
  },
  red: {
    color: '#ef4444',
    label: 'Necesita Atención',
    bgColor: 'bg-red-500/10',
  },
};

function HeaderSkeleton() {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="text-center sm:text-left space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="w-3 h-3 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HealthPage() {
  const { data, isLoading, error, needsOnboarding, fetchHealthScore } = useHealthScore();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salud Financiera</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Evaluación de tu estado financiero actual
          </p>
        </div>
        <div
          className="glass rounded-xl p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="p-4 rounded-full bg-red-500/10">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Error al cargar datos</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchHealthScore()}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salud Financiera</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Evaluación de tu estado financiero actual
          </p>
        </div>
        <HeaderSkeleton />
        <MetricsSkeleton />
      </div>
    );
  }

  if (needsOnboarding || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salud Financiera</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Evaluación de tu estado financiero actual
          </p>
        </div>
        <div className="glass rounded-xl p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center border-4 border-muted/50">
              <span className="text-3xl text-muted-foreground">?</span>
            </div>
            <div className="text-center max-w-md">
              <p className="text-lg font-medium text-foreground">Sin datos suficientes</p>
              <p className="text-sm text-muted-foreground mt-2">
                Para calcular tu salud financiera necesitamos más información sobre tus transacciones y presupuestos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfig[data.overall_status];
  const trendIcon = data.trend.value >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salud Financiera</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Evaluación de tu estado financiero actual
        </p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center border-4',
              config.bgColor
            )}
            style={{ borderColor: config.color }}
          >
            <div
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: config.color }}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado General
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {config.label}
            </p>
            <p className="text-lg text-muted-foreground mt-1">
              Score: <span className="font-semibold text-foreground">{data.overall_score}</span> / 100
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          name="Tasa de Ahorro"
          value={data.savings_rate.value}
          score={data.savings_rate.score}
          status={data.savings_rate.status}
          icon={PiggyBank}
        />
        <MetricCard
          name="Gastos Fijos"
          value={data.fixed_expenses.value}
          score={data.fixed_expenses.score}
          status={data.fixed_expenses.status}
          icon={Home}
        />
        <MetricCard
          name="Adherencia a Presupuesto"
          value={data.budget_adherence.value}
          score={data.budget_adherence.score}
          status={data.budget_adherence.status}
          icon={Target}
        />
        <MetricCard
          name="Tendencia Mensual"
          value={Math.abs(data.trend.value)}
          score={data.trend.score}
          status={data.trend.status}
          icon={trendIcon}
        />
      </div>
    </div>
  );
}
