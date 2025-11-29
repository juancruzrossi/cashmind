'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
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
  default: 'from-card to-card',
  primary: 'from-primary/20 to-primary/5',
  success: 'from-emerald-500/20 to-emerald-500/5',
  warning: 'from-amber-500/20 to-amber-500/5',
  danger: 'from-red-500/20 to-red-500/5',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-emerald-500/20 text-emerald-500',
  warning: 'bg-amber-500/20 text-amber-500',
  danger: 'bg-red-500/20 text-red-500',
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
  const trendColor = trend && trend > 0 ? 'text-emerald-500' : trend && trend < 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className={cn('overflow-hidden border-border/50 glass-hover', className)}>
      <CardContent className={cn('p-6 bg-gradient-to-br', variantStyles[variant])}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconVariantStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-4">
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('text-sm font-medium', trendColor)}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
