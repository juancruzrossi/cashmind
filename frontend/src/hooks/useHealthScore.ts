'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

type MetricStatus = 'green' | 'yellow' | 'red';

interface Metric {
  value: number;
  score: number;
  status: MetricStatus;
}

interface OnboardingStatus {
  income_count: number;
  expense_count: number;
  budget_count: number;
  income_required: number;
  expense_required: number;
  budget_required: number;
}

interface HealthScoreData {
  month: string;
  savings_rate: Metric;
  fixed_expenses: Metric;
  budget_adherence: Metric;
  trend: Metric;
  overall_score: number;
  overall_status: MetricStatus;
  needs_onboarding: boolean;
  onboarding_status?: OnboardingStatus;
}

interface AdviceData {
  advice: string;
  generated_at: string | null;
}

export function useHealthScore() {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHealthScore = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getHealthScore() as HealthScoreData;
      setData(response);

      if (!response.needs_onboarding) {
        const adviceResponse = await api.getHealthScoreAdvice() as AdviceData;
        setAdvice(adviceResponse.advice);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al cargar salud financiera');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const regenerateAdvice = useCallback(async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await api.regenerateHealthScoreAdvice() as AdviceData;
      setAdvice(response.advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al regenerar consejo');
      throw err;
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthScore();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchHealthScore]);

  return {
    data,
    advice,
    isLoading,
    isRegenerating,
    error,
    needsOnboarding: data?.needs_onboarding ?? false,
    onboardingStatus: data?.onboarding_status ?? null,
    fetchHealthScore,
    regenerateAdvice,
  };
}

export type { OnboardingStatus };
