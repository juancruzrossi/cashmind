'use client';

import { useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import type { Transaction } from '@/types';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransaction?: Transaction | null;
}

export function TransactionForm({ open, onOpenChange, editTransaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>(editTransaction?.type || 'expense');
  const [date, setDate] = useState<Date>(editTransaction ? new Date(editTransaction.date) : new Date());
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [amount, setAmount] = useState(editTransaction?.amount.toString() || '');
  const [category, setCategory] = useState(editTransaction?.category || '');
  const [notes, setNotes] = useState(editTransaction?.notes || '');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setDate(new Date(editTransaction.date));
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setNotes(editTransaction.notes || '');
    } else {
      resetForm();
    }
  }, [editTransaction, open]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedAmount = amount.replace(',', '.');
      const transactionData = {
        date: format(date, 'yyyy-MM-dd'),
        description,
        amount: parseFloat(normalizedAmount),
        type,
        category,
        notes,
        is_recurring: false,
      };

      if (editTransaction) {
        await updateTransaction(parseInt(editTransaction.id), transactionData);
      } else {
        await addTransaction(transactionData);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('expense');
    setDate(new Date());
    setDescription('');
    setAmount('');
    setCategory('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editTransaction ? 'Editar' : 'Nueva'} Transacción</DialogTitle>
          <DialogDescription>
            {editTransaction ? 'Modifica los datos de la transacción' : 'Registra un nuevo movimiento financiero'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
                Gasto
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
                Ingreso
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    setAmount(value);
                  }}
                  className="pl-8"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Compra en supermercado"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {date ? format(date, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agrega notas adicionales..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-chart-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editTransaction ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
