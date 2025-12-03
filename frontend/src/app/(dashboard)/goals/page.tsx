'use client';

import { useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGoals } from '@/hooks/useGoals';
import { PeriodFilter, PeriodValue, getDateRange } from '@/components/dashboard/period-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus,
  Target,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarIcon,
  Trophy,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Shield,
  Sparkles,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: 'savings' | 'investment' | 'debt' | 'purchase' | 'emergency' | 'other';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Ahorro', icon: PiggyBank, color: '#10B981' },
  { value: 'investment', label: 'Inversión', icon: TrendingUp, color: '#3B82F6' },
  { value: 'debt', label: 'Pagar Deuda', icon: CreditCard, color: '#EF4444' },
  { value: 'purchase', label: 'Compra', icon: ShoppingCart, color: '#F59E0B' },
  { value: 'emergency', label: 'Fondo de Emergencia', icon: Shield, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Sparkles, color: '#6B7280' },
];

function GoalsPage() {
  const searchParams = useSearchParams();
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal, isLoading } = useGoals();

  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true');
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState<Goal['category']>('savings');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [filterPeriod, setFilterPeriod] = useState<PeriodValue>({ type: 'current_month' });
  const { startDate, endDate } = getDateRange(filterPeriod);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (!g.deadline) return true;
      const goalDeadline = new Date(g.deadline);
      return goalDeadline >= new Date(startDate) && goalDeadline <= new Date(endDate);
    });
  }, [goals, startDate, endDate]);

  const activeGoals = filteredGoals.filter((g) => g.current_amount < g.target_amount).length;
  const completedGoals = filteredGoals.filter((g) => g.current_amount >= g.target_amount).length;
  const totalSaved = filteredGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = filteredGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedTarget = targetAmount.replace(',', '.');
      const normalizedCurrent = currentAmount.replace(',', '.');
      const goalData = {
        name,
        description,
        target_amount: parseFloat(normalizedTarget),
        current_amount: parseFloat(normalizedCurrent) || 0,
        category,
        deadline: deadline?.toISOString().split('T')[0],
        color: GOAL_CATEGORIES.find((c) => c.value === category)?.color,
      };

      if (editGoal) {
        await updateGoal(editGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTargetAmount('');
    setCurrentAmount('');
    setCategory('savings');
    setDeadline(undefined);
    setEditGoal(null);
    setIsFormOpen(false);
  };

  const handleEdit = (goal: Goal) => {
    setEditGoal(goal);
    setName(goal.name);
    setDescription(goal.description || '');
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setCategory(goal.category);
    setDeadline(goal.deadline ? new Date(goal.deadline) : undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta meta?')) {
      await deleteGoal(id);
    }
  };

  const handleContribute = async () => {
    if (selectedGoal && contributeAmount) {
      setIsSubmitting(true);
      try {
        const normalizedContribute = contributeAmount.replace(',', '.');
        await contributeToGoal(selectedGoal.id, parseFloat(normalizedContribute));
        setIsContributeOpen(false);
        setContributeAmount('');
        setSelectedGoal(null);
      } catch (error) {
        console.error('Error contributing:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getCategoryInfo = (cat: string) => {
    return GOAL_CATEGORIES.find((c) => c.value === cat) || GOAL_CATEGORIES[5];
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Metas Financieras</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Establece y alcanza tus objetivos
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
            Nueva Meta
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
                <p className="text-sm text-muted-foreground">Metas Activas</p>
                <p className="text-2xl font-bold">{activeGoals}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-emerald-500">{completedGoals}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ahorrado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
              </div>
              <div className="p-3 rounded-xl bg-chart-2/20">
                <PiggyBank className="w-5 h-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso Global</p>
                <p className="text-2xl font-bold">
                  {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-chart-3/20">
                <TrendingUp className="w-5 h-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass">
        <CardHeader>
          <CardTitle>Mis Metas</CardTitle>
          <CardDescription>Progreso hacia tus objetivos financieros</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No hay metas</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                Define tus objetivos financieros y sigue tu progreso
              </p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="mt-6"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Meta
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => {
                const percentage = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                const isCompleted = percentage >= 100;
                const categoryInfo = getCategoryInfo(goal.category);
                const Icon = categoryInfo.icon;

                return (
                  <Card
                    key={goal.id}
                    className={cn(
                      'border-border/50 transition-all hover:border-primary/30',
                      isCompleted && 'border-emerald-500/30 bg-emerald-500/5'
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                          >
                            <Icon className="w-6 h-6" style={{ color: categoryInfo.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {categoryInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            {!isCompleted && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  setIsContributeOpen(true);
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Aportar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(goal)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(goal.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {goal.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-2xl font-bold">
                              {formatCurrency(Number(goal.current_amount))}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              de {formatCurrency(Number(goal.target_amount))}
                            </p>
                          </div>
                          <div
                            className={cn(
                              'text-sm font-medium',
                              isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
                            )}
                          >
                            {percentage.toFixed(0)}%
                          </div>
                        </div>

                        <Progress
                          value={Math.min(percentage, 100)}
                          className={cn('h-2', isCompleted && '[&>div]:bg-emerald-500')}
                        />

                        {isCompleted ? (
                          <div className="flex items-center gap-2 text-sm text-emerald-500">
                            <Trophy className="w-4 h-4" />
                            Meta alcanzada
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Faltan: {formatCurrency(Number(goal.target_amount) - Number(goal.current_amount))}
                          </p>
                        )}

                        {goal.deadline && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                            <CalendarIcon className="w-3 h-3" />
                            Fecha límite: {format(new Date(goal.deadline), 'PP', { locale: es })}
                          </div>
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
        <DialogContent className="sm:max-w-[500px] glass">
          <DialogHeader>
            <DialogTitle>{editGoal ? 'Editar' : 'Nueva'} Meta</DialogTitle>
            <DialogDescription>
              {editGoal ? 'Modifica los detalles de tu meta' : 'Define un nuevo objetivo financiero'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la meta</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Fondo de emergencia"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu objetivo..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Goal['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  {GOAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Monto objetivo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="targetAmount"
                    type="text"
                    inputMode="decimal"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="pl-8"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currentAmount">Monto actual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="currentAmount"
                    type="text"
                    inputMode="decimal"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="pl-8"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Fecha límite (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !deadline && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-chart-2" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editGoal ? 'Guardar Cambios' : 'Crear Meta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent className="sm:max-w-[400px] glass">
          <DialogHeader>
            <DialogTitle>Aportar a meta</DialogTitle>
            <DialogDescription>
              {selectedGoal?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="contributeAmount">Monto a aportar</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="contributeAmount"
                  type="text"
                  inputMode="decimal"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="pl-8"
                  placeholder="0,00"
                />
              </div>
            </div>

            {selectedGoal && (
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progreso actual</span>
                  <span>{formatCurrency(Number(selectedGoal.current_amount))}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Después del aporte</span>
                  <span className="text-emerald-500">
                    {formatCurrency(Number(selectedGoal.current_amount) + (parseFloat(contributeAmount) || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span>{formatCurrency(Number(selectedGoal.target_amount))}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsContributeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleContribute} className="bg-gradient-to-r from-primary to-chart-2" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GoalsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <GoalsPage />
    </Suspense>
  );
}
