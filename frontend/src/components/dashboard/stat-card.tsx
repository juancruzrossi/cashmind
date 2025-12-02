'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: '',
  primary: 'border-primary/10',
  success: 'border-emerald-500/10',
  warning: 'border-amber-500/10',
  danger: 'border-red-500/10',
};

const iconVariantStyles = {
  default: 'bg-white/[0.03] text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
}: StatCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-emerald-400' : trend && trend < 0 ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'glass rounded-xl p-5 transition-all duration-300 hover:bg-[rgba(24,24,30,0.7)] hover:border-primary/10',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconVariantStyles[variant])}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)]">
          <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
          <span className={cn('text-sm font-medium', trendColor)}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
