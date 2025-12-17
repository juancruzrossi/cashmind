'use client';

import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PendingAction, TransactionData, BudgetData, GoalContributionData } from '@/lib/chat/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';

interface ChatConfirmationProps {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ChatConfirmation({
  action,
  onConfirm,
  onCancel,
  isLoading,
}: ChatConfirmationProps) {
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);

  const getCategoryLabel = (category: string, type: string) => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="bg-[#121216] rounded-xl p-3 border border-[rgba(255,255,255,0.08)]">
      {action.type === 'create_transaction' && (
        <div className="space-y-1.5 mb-3 text-sm">
          {(() => {
            const data = action.data as TransactionData;
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className={data.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                    {data.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-semibold">{formatAmount(data.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descripción:</span>
                  <span className="text-right max-w-[60%] truncate">{data.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span>{getCategoryLabel(data.category, data.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{data.date}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {action.type === 'create_budget' && (
        <div className="space-y-1.5 mb-3 text-sm">
          {(() => {
            const data = action.data as BudgetData;
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span>{data.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span>{getCategoryLabel(data.category, 'expense')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Límite:</span>
                  <span className="font-semibold">{formatAmount(data.limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span>
                    {data.period === 'monthly'
                      ? 'Mensual'
                      : data.period === 'weekly'
                        ? 'Semanal'
                        : 'Anual'}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {action.type === 'contribute_goal' && (
        <div className="space-y-1.5 mb-3 text-sm">
          {(() => {
            const data = action.data as GoalContributionData;
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta:</span>
                  <span>{data.goalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aporte:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatAmount(data.amount)}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="size-3.5 mr-1" />
          Cancelar
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 text-xs bg-gradient-to-r from-primary to-chart-2"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 mr-1 animate-spin" />
          ) : (
            <Check className="size-3.5 mr-1" />
          )}
          Confirmar
        </Button>
      </div>
    </div>
  );
}
