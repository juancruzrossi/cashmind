'use client';

import Link from 'next/link';
import { Check, Circle, DollarSign, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { OnboardingStatus } from '@/hooks/useHealthScore';

interface OnboardingWizardProps {
  status: OnboardingStatus;
}

interface RequirementItemProps {
  label: string;
  current: number;
  required: number;
  href: string;
  icon: React.ElementType;
}

function RequirementItem({ label, current, required, href, icon: Icon }: RequirementItemProps) {
  const isComplete = current >= required;

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            isComplete ? 'bg-emerald-500/20' : 'bg-muted/30'
          )}
        >
          {isComplete ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Icon className={cn('w-5 h-5', 'text-muted-foreground')} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'font-medium',
              isComplete ? 'text-muted-foreground line-through' : 'text-foreground'
            )}>
              {label}
            </p>
            <span className={cn(
              'text-sm font-medium',
              isComplete ? 'text-emerald-400' : 'text-muted-foreground'
            )}>
              {current}/{required}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isComplete ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min((current / required) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
      {!isComplete && (
        <div className="mt-3 pl-14">
          <Link href={href}>
            <Button variant="outline" size="sm" className="text-xs">
              Agregar {label.toLowerCase()}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export function OnboardingWizard({ status }: OnboardingWizardProps) {
  const completedCount = [
    status.income_count >= status.income_required,
    status.expense_count >= status.expense_required,
  ].filter(Boolean).length;

  return (
    <div className="glass rounded-xl p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 border-4 border-muted/50">
          <Circle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Configura tu Salud Financiera
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Para calcular tu evaluaci&oacute;n financiera necesitamos algunos datos b&aacute;sicos.
          Completa los siguientes requisitos:
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-2xl font-bold text-foreground">{completedCount}</span>
          <span className="text-muted-foreground">de 2 completados</span>
        </div>
      </div>

      <div className="space-y-3">
        <RequirementItem
          label="Ingreso"
          current={status.income_count}
          required={status.income_required}
          href="/transactions?type=income&action=new"
          icon={DollarSign}
        />
        <RequirementItem
          label="Gastos"
          current={status.expense_count}
          required={status.expense_required}
          href="/transactions?type=expense&action=new"
          icon={Receipt}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Una vez completes estos requisitos, podr&aacute;s ver tu evaluaci&oacute;n de salud financiera.
      </p>
    </div>
  );
}
