'use client';

import { useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { PeriodFilter, PeriodValue, getDateRange } from '@/components/dashboard/period-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  PiggyBank,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/types';

interface Budget {
  id: number;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

function BudgetsPage() {
  const searchParams = useSearchParams();
  const { budgets, addBudget, updateBudget, deleteBudget, isLoading } = useBudgets();
  const { transactions } = useTransactions();

  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [filterPeriod, setFilterPeriod] = useState<PeriodValue>({ type: 'current_month' });
  const { startDate, endDate } = getDateRange(filterPeriod);

  const budgetsWithSpent = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          const isInPeriod = tDate >= new Date(startDate) && tDate <= new Date(endDate);
          return t.type === 'expense' && t.category === budget.category && isInPeriod;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, calculatedSpent: spent };
    });
  }, [budgets, transactions, startDate, endDate]);

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit), 0);
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.calculatedSpent, 0);
  const overBudgetCount = budgetsWithSpent.filter((b) => b.calculatedSpent > Number(b.limit)).length;
  const healthyCount = budgetsWithSpent.filter((b) => b.calculatedSpent <= Number(b.limit) * 0.8).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const budgetData = {
        name,
        category,
        limit: parseFloat(limit),
        period: budgetPeriod,
        color: CATEGORY_COLORS[category] || '#6B7280',
      };

      if (editBudget) {
        await updateBudget(editBudget.id, budgetData);
      } else {
        await addBudget(budgetData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setLimit('');
    setBudgetPeriod('monthly');
    setEditBudget(null);
    setIsFormOpen(false);
  };

  const handleEdit = (budget: Budget) => {
    setEditBudget(budget);
    setName(budget.name);
    setCategory(budget.category);
    setLimit(budget.limit.toString());
    setBudgetPeriod(budget.period);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      await deleteBudget(id);
    }
  };

  const getCategoryLabel = (cat: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Presupuestos</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Controla tus gastos por categoría
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-primary to-chart-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        </div>
        <div className="flex justify-start sm:justify-end">
          <PeriodFilter value={filterPeriod} onChange={setFilterPeriod} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <PiggyBank className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excedidos</p>
                <p className="text-2xl font-bold text-red-500">{overBudgetCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saludables</p>
                <p className="text-2xl font-bold text-emerald-500">{healthyCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass">
        <CardHeader>
          <CardTitle>Mis Presupuestos</CardTitle>
          <CardDescription>Estado actual de tus presupuestos mensuales</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetsWithSpent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <PiggyBank className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No hay presupuestos</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                Crea presupuestos para controlar tus gastos por categoría
              </p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="mt-6"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Presupuesto
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetsWithSpent.map((budget) => {
                const percentage = (budget.calculatedSpent / Number(budget.limit)) * 100;
                const isOver = percentage > 100;
                const isWarning = percentage > 80 && percentage <= 100;

                return (
                  <Card
                    key={budget.id}
                    className={cn(
                      'border-border/50 transition-colors',
                      isOver && 'border-red-500/30 bg-red-500/5',
                      isWarning && 'border-amber-500/30 bg-amber-500/5'
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${budget.color || '#6B7280'}20` }}
                          >
                            <PiggyBank className="w-5 h-5" style={{ color: budget.color || '#6B7280' }} />
                          </div>
                          <div>
                            <p className="font-medium">{budget.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCategoryLabel(budget.category)}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem onClick={() => handleEdit(budget)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(budget.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-2xl font-bold">
                              {formatCurrency(budget.calculatedSpent)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              de {formatCurrency(Number(budget.limit))}
                            </p>
                          </div>
                          <div
                            className={cn(
                              'text-sm font-medium',
                              isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
                            )}
                          >
                            {percentage.toFixed(0)}%
                          </div>
                        </div>

                        <Progress
                          value={Math.min(percentage, 100)}
                          className={cn(
                            'h-2',
                            isOver && '[&>div]:bg-red-500',
                            isWarning && '[&>div]:bg-amber-500'
                          )}
                        />

                        {isOver && (
                          <div className="flex items-center gap-2 text-sm text-red-500">
                            <AlertTriangle className="w-4 h-4" />
                            Excedido por {formatCurrency(budget.calculatedSpent - Number(budget.limit))}
                          </div>
                        )}

                        {!isOver && (
                          <p className="text-sm text-muted-foreground">
                            Disponible: {formatCurrency(Number(budget.limit) - budget.calculatedSpent)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[450px] glass">
          <DialogHeader>
            <DialogTitle>{editBudget ? 'Editar' : 'Nuevo'} Presupuesto</DialogTitle>
            <DialogDescription>
              {editBudget ? 'Modifica los detalles del presupuesto' : 'Define un límite de gastos para una categoría'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Gastos de alimentación"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="glass">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="limit">Límite</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Período</Label>
                <Select value={budgetPeriod} onValueChange={(v) => setBudgetPeriod(v as typeof budgetPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-chart-2" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editBudget ? 'Guardar Cambios' : 'Crear Presupuesto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BudgetsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <BudgetsPage />
    </Suspense>
  );
}
