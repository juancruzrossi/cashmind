export type FlowType =
  | 'create_expense'
  | 'create_income'
  | 'create_budget'
  | 'contribute_goal'
  | 'analyze_receipt';

export type IntentType =
  | 'create_expense'
  | 'create_income'
  | 'create_budget'
  | 'contribute_goal'
  | 'list_transactions'
  | 'check_balance'
  | 'greeting'
  | 'help'
  | 'thanks'
  | 'unknown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  metadata?: {
    intent?: IntentType;
    confirmationRequired?: boolean;
  };
}

export interface TransactionData {
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  notes?: string;
}

export interface BudgetData {
  name: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

export interface GoalContributionData {
  goalId: number;
  goalName: string;
  amount: number;
}

export type PendingActionType = 'create_transaction' | 'create_budget' | 'contribute_goal';

export interface PendingAction {
  type: PendingActionType;
  data: TransactionData | BudgetData | GoalContributionData;
}

export interface CollectedData {
  amount?: number;
  description?: string;
  date?: string;
  type?: 'income' | 'expense';
  category?: string;
  name?: string;
  limit?: number;
  period?: string;
  goalName?: string;
  goalId?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  currentFlow: FlowType | null;
  pendingAction: PendingAction | null;
  collectedData: CollectedData;
}

export interface InterpretResponse {
  intent: IntentType;
  extractedData: Record<string, unknown> | null;
  missingFields: string[];
  response: string;
  isComplete: boolean;
}

export interface ReceiptAnalysisResponse {
  success: boolean;
  data?: {
    amount: number;
    description: string;
    date: string;
    type: 'income' | 'expense';
    category: string;
    confidence: number;
  };
  error?: string;
}
