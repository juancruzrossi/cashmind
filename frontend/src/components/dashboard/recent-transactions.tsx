'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getCategoryLabel = (category: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find(c => c.value === category)?.label || category;
  };

  return (
    <Card className="border-border/50 glass">
      <CardHeader>
        <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
        <CardDescription>Últimos movimientos de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No hay transacciones aún</p>
              <p className="text-sm text-muted-foreground mt-1">
                Agrega tu primera transacción
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      transaction.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {getCategoryLabel(transaction.category, transaction.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'text-right font-semibold shrink-0 text-sm whitespace-nowrap pl-2',
                      transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ArrowLeftRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
