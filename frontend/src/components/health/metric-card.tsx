'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type Status = 'green' | 'yellow' | 'red';

const statusConfig: Record<Status, { color: string; bgColor: string; label: string }> = {
  green: {
    color: '#22c55e',
    bgColor: 'bg-emerald-500/10',
    label: 'Excelente',
  },
  yellow: {
    color: '#eab308',
    bgColor: 'bg-yellow-500/10',
    label: 'Regular',
  },
  red: {
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    label: 'Necesita Atención',
  },
};

interface MetricCardProps {
  name: string;
  value: number;
  score: number;
  status: Status;
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({ name, value, score, status, icon: Icon, className }: MetricCardProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'glass rounded-xl p-5 transition-all duration-300 hover:bg-[rgba(24,24,30,0.7)]',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn('p-2.5 rounded-lg', config.bgColor)}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config.color }}
          title={config.label}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold text-foreground">
            {value.toFixed(0)}%
          </span>
          <span className="text-xs text-muted-foreground">
            Score: {score}
          </span>
        </div>

        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
