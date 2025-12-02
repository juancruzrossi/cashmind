'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  progress: number;
  deadline?: string;
  category: 'savings' | 'investment' | 'debt' | 'purchase' | 'emergency' | 'other';
  icon?: string;
  color?: string;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Goal[];
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getGoals() as PaginatedResponse;
      setGoals(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar metas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'progress' | 'created_at'>) => {
    const newGoal = await api.createGoal(goal) as Goal;
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback(async (id: number, updates: Partial<Goal>) => {
    const updated = await api.updateGoal(id, updates) as Goal;
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const deleteGoal = useCallback(async (id: number) => {
    await api.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const contributeToGoal = useCallback(async (id: number, amount: number) => {
    const updated = await api.contributeToGoal(id, amount) as Goal;
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    isLoading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
  };
}
