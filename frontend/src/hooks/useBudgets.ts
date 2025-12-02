'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Budget {
  id: number;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color?: string;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Budget[];
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getBudgets() as PaginatedResponse;
      setBudgets(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar presupuestos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'spent' | 'created_at'>) => {
    const newBudget = await api.createBudget(budget) as Budget;
    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  }, []);

  const updateBudget = useCallback(async (id: number, updates: Partial<Budget>) => {
    const updated = await api.updateBudget(id, updates) as Budget;
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const deleteBudget = useCallback(async (id: number) => {
    await api.deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    isLoading,
    error,
    fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
