'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { events, EVENTS } from '@/lib/events';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  notes?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  created_at: string;
}

interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  monthlyAvgIncome: number;
  monthlyAvgExpenses: number;
  topExpenseCategory: string;
  budgetUtilization: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (params?: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTransactions(params) as PaginatedResponse;
      setTransactions(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTransaction = await api.createTransaction(transaction) as Transaction;
    setTransactions((prev) => [newTransaction, ...prev]);
    events.emit(EVENTS.TRANSACTION_CHANGED);
    return newTransaction;
  }, []);

  const updateTransaction = useCallback(async (id: number, updates: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, updates) as Transaction;
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    events.emit(EVENTS.TRANSACTION_CHANGED);
    return updated;
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    events.emit(EVENTS.TRANSACTION_CHANGED);
  }, []);

  useEffect(() => {
    fetchTransactions();
    const unsubscribe = events.on(EVENTS.TRANSACTION_CHANGED, () => fetchTransactions());
    return unsubscribe;
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export function useTransactionStats(startDate?: string, endDate?: string) {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await api.getTransactionStats(params) as TransactionStats;
      setStats(data);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
    const unsubscribe = events.on(EVENTS.TRANSACTION_CHANGED, fetchStats);
    return unsubscribe;
  }, [fetchStats]);

  return { stats, isLoading };
}

export function useMonthlyData(startDate?: string, endDate?: string) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const result = await api.getMonthlyData(params) as MonthlyData[];
      setData(result);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
    const unsubscribe = events.on(EVENTS.TRANSACTION_CHANGED, fetchData);
    return unsubscribe;
  }, [fetchData]);

  return { data, isLoading };
}

export function useCategoryBreakdown(type: 'income' | 'expense', startDate?: string, endDate?: string) {
  const [data, setData] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { type };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const result = await api.getCategoryBreakdown(type, params) as CategoryBreakdown[];
      setData(result);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [type, startDate, endDate]);

  useEffect(() => {
    fetchData();
    const unsubscribe = events.on(EVENTS.TRANSACTION_CHANGED, fetchData);
    return unsubscribe;
  }, [fetchData]);

  return { data, isLoading };
}
