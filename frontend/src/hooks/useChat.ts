'use client';

import { useState, useCallback, useReducer } from 'react';
import { api } from '@/lib/api';
import { useTransactions } from './useTransactions';
import { useBudgets } from './useBudgets';
import { useGoals } from './useGoals';
import { chatReducer, initialState } from '@/lib/chat/state-machine';
import { validateTransactionData } from '@/lib/chat/validators';
import type {
  FlowType,
  InterpretResponse,
  ReceiptAnalysisResponse,
  TransactionData,
  BudgetData,
  GoalContributionData,
} from '@/lib/chat/types';

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addTransaction } = useTransactions();
  const { addBudget } = useBudgets();
  const { contributeToGoal, goals, fetchGoals } = useGoals();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      dispatch({ type: 'ADD_USER_MESSAGE', payload: content });
      setIsProcessing(true);

      try {
        const interpretation = (await api.chatInterpret(
          content,
          state.currentFlow || undefined,
          state.collectedData as Record<string, unknown>
        )) as InterpretResponse;

        dispatch({ type: 'PROCESS_INTENT', payload: interpretation });
      } catch (error) {
        dispatch({
          type: 'ADD_ERROR_MESSAGE',
          payload: 'Perdón, hubo un error. ¿Podés intentar de nuevo?',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [state.currentFlow, state.collectedData]
  );

  const analyzeImage = useCallback(async (file: File) => {
    dispatch({ type: 'ADD_USER_IMAGE', payload: URL.createObjectURL(file) });
    dispatch({
      type: 'ADD_ASSISTANT_MESSAGE',
      payload: 'Analizando la imagen...',
    });
    setIsProcessing(true);

    try {
      const result = (await api.chatAnalyzeReceipt(file)) as ReceiptAnalysisResponse;

      if (result.success && result.data) {
        const transactionData: TransactionData = {
          amount: result.data.amount,
          description: result.data.description,
          date: result.data.date,
          type: result.data.type,
          category: result.data.category,
        };

        const validated = validateTransactionData(transactionData);
        if (validated) {
          dispatch({ type: 'SET_RECEIPT_DATA', payload: validated });
        } else {
          dispatch({
            type: 'ADD_ERROR_MESSAGE',
            payload: 'No pude extraer los datos correctamente. ¿Podés contarme los detalles manualmente?',
          });
        }
      } else {
        dispatch({
          type: 'ADD_ERROR_MESSAGE',
          payload: result.error || 'No pude analizar la imagen. Intentá con otra foto más clara.',
        });
      }
    } catch (error) {
      dispatch({
        type: 'ADD_ERROR_MESSAGE',
        payload: 'Hubo un error al analizar la imagen. Intentá de nuevo.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const confirmAction = useCallback(async () => {
    if (!state.pendingAction) return;

    setIsProcessing(true);
    try {
      switch (state.pendingAction.type) {
        case 'create_transaction': {
          const data = state.pendingAction.data as TransactionData;
          await addTransaction({
            date: data.date,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            notes: data.notes,
            is_recurring: false,
          });
          break;
        }
        case 'create_budget': {
          const data = state.pendingAction.data as BudgetData;
          await addBudget({
            name: data.name,
            category: data.category,
            limit: data.limit,
            period: data.period,
          });
          break;
        }
        case 'contribute_goal': {
          const data = state.pendingAction.data as GoalContributionData;
          await contributeToGoal(data.goalId, data.amount);
          break;
        }
      }

      dispatch({ type: 'ACTION_COMPLETED' });
    } catch (error) {
      dispatch({
        type: 'ADD_ERROR_MESSAGE',
        payload: 'No se pudo completar la operación. Intentá de nuevo.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [state.pendingAction, addTransaction, addBudget, contributeToGoal]);

  const cancelAction = useCallback(() => {
    dispatch({ type: 'CANCEL_ACTION' });
  }, []);

  const selectQuickAction = useCallback((action: FlowType) => {
    dispatch({ type: 'START_FLOW', payload: action });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    messages: state.messages,
    currentFlow: state.currentFlow,
    pendingAction: state.pendingAction,
    isProcessing,
    goals,
    sendMessage,
    analyzeImage,
    confirmAction,
    cancelAction,
    selectQuickAction,
    resetChat,
    fetchGoals,
  };
}
