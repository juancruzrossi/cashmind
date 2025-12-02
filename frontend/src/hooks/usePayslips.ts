'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { events, EVENTS } from '@/lib/events';

interface Deduction {
  id: number;
  name: string;
  amount: number;
  percentage?: number;
  category: 'tax' | 'social_security' | 'retirement' | 'health' | 'other';
}

interface Bonus {
  id: number;
  name: string;
  amount: number;
  type: 'regular' | 'performance' | 'holiday' | 'other';
}

interface Payslip {
  id: number;
  month: string;
  year: number;
  upload_date: string;
  gross_salary: number;
  net_salary: number;
  employer?: string;
  position?: string;
  deductions: Deduction[];
  bonuses: Bonus[];
}

interface AnalyzedPayslip {
  employer?: string;
  position?: string;
  period?: {
    month: string;
    year: number;
  };
  grossSalary?: number;
  netSalary?: number;
  deductions?: Array<{
    name: string;
    amount: number;
    percentage?: number;
    category: string;
  }>;
  bonuses?: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payslip[];
}

export function usePayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPayslips() as PaginatedResponse;
      setPayslips(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recibos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzePayslip = useCallback(async (file: File) => {
    const result = await api.analyzePayslip(file) as { success: boolean; data: AnalyzedPayslip; file_name: string };
    return result;
  }, []);

  const addPayslip = useCallback(async (payslipData: {
    month: string;
    year: number;
    gross_salary: number;
    net_salary: number;
    employer?: string;
    position?: string;
    deductions?: Array<{ name: string; amount: number; percentage?: number; category: string }>;
    bonuses?: Array<{ name: string; amount: number; type: string }>;
    create_transaction?: boolean;
  }) => {
    const newPayslip = await api.createPayslip(payslipData) as Payslip;
    setPayslips((prev) => [newPayslip, ...prev]);
    events.emit(EVENTS.PAYSLIP_CHANGED);
    if (payslipData.create_transaction) {
      events.emit(EVENTS.TRANSACTION_CHANGED);
    }
    return newPayslip;
  }, []);

  const deletePayslip = useCallback(async (id: number) => {
    await api.deletePayslip(id);
    setPayslips((prev) => prev.filter((p) => p.id !== id));
    events.emit(EVENTS.PAYSLIP_CHANGED);
    events.emit(EVENTS.TRANSACTION_CHANGED);
  }, []);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  return {
    payslips,
    isLoading,
    error,
    fetchPayslips,
    analyzePayslip,
    addPayslip,
    deletePayslip,
  };
}
