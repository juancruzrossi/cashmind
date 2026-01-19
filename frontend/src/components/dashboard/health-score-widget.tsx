'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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

interface HealthScoreWidgetProps {
  className?: string;
}

export function HealthScoreWidget({ className }: HealthScoreWidgetProps) {
  const { data, isLoading, error, needsOnboarding, fetchHealthScore } = useHealthScore();

  if (error) {
    return (
      <div
        className={cn(
          'glass rounded-xl p-5 transition-all duration-300',
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Error</p>
            <p className="text-xs text-muted-foreground mt-1">No se pudo cargar</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHealthScore()}
            className="mt-1 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div
        className={cn(
          'glass rounded-xl p-5 transition-all duration-300',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (needsOnboarding || !data) {
    return (
      <div
        className={cn(
          'glass rounded-xl p-5 transition-all duration-300',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border-4 border-muted/50">
            <span className="text-xl text-muted-foreground">?</span>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Salud Financiera
            </p>
            <p className="text-sm text-muted-foreground mt-1">Sin datos suficientes</p>
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfig[data.overall_status];

  return (
    <div
      className={cn(
        'glass rounded-xl p-5 transition-all duration-300 hover:bg-[rgba(24,24,30,0.7)] hover:border-primary/10',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center border-4',
            config.bgColor
          )}
          style={{ borderColor: config.color }}
        >
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: config.color }}
          />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Salud Financiera
          </p>
          <p className="text-lg font-semibold text-foreground mt-1">
            {config.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Score: {data.overall_score}
          </p>
        </div>
      </div>
    </div>
  );
}
