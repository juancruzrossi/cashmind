import type {
  ChatState,
  ChatMessage,
  FlowType,
  PendingAction,
  InterpretResponse,
  CollectedData,
  TransactionData,
} from './types';

export const initialState: ChatState = {
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente financiero. ¿Qué te gustaría hacer hoy?',
      timestamp: new Date(),
    },
  ],
  currentFlow: null,
  pendingAction: null,
  collectedData: {},
};

export type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; payload: string }
  | { type: 'ADD_USER_IMAGE'; payload: string }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: string }
  | { type: 'ADD_ERROR_MESSAGE'; payload: string }
  | { type: 'PROCESS_INTENT'; payload: InterpretResponse }
  | { type: 'START_FLOW'; payload: FlowType }
  | { type: 'SET_PENDING_ACTION'; payload: PendingAction }
  | { type: 'SET_RECEIPT_DATA'; payload: TransactionData }
  | { type: 'ACTION_COMPLETED' }
  | { type: 'CANCEL_ACTION' }
  | { type: 'RESET' };

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatConfirmationMessage(action: PendingAction): string {
  if (action.type === 'create_transaction') {
    const data = action.data as TransactionData;
    const typeLabel = data.type === 'income' ? 'ingreso' : 'gasto';
    const amount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(data.amount);
    return `¿Confirmo el ${typeLabel} de ${amount} por "${data.description}"?`;
  }

  if (action.type === 'create_budget') {
    const data = action.data as { name: string; limit: number; category: string };
    const amount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(data.limit);
    return `¿Confirmo crear el presupuesto "${data.name}" con límite de ${amount}?`;
  }

  if (action.type === 'contribute_goal') {
    const data = action.data as { goalName: string; amount: number };
    const amount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(data.amount);
    return `¿Confirmo aportar ${amount} a la meta "${data.goalName}"?`;
  }

  return '¿Confirmás esta acción?';
}

const flowStartMessages: Record<FlowType, string> = {
  create_expense: '¡Dale! Contame sobre tu gasto. ¿Qué compraste y cuánto fue?',
  create_income: '¡Genial! Registremos tu ingreso. ¿Cuánto cobraste y por qué concepto?',
  create_budget: 'Vamos a crear un presupuesto. ¿Para qué categoría y cuál es el límite mensual?',
  contribute_goal: '¿A cuál de tus metas querés aportar y cuánto?',
  analyze_receipt: 'Subí una foto del ticket o recibo y lo analizo por vos.',
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'user',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
      };

    case 'ADD_USER_IMAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'user',
            content: 'Imagen enviada',
            imageUrl: action.payload,
            timestamp: new Date(),
          },
        ],
      };

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
      };

    case 'ADD_ERROR_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
      };

    case 'PROCESS_INTENT': {
      const { intent, extractedData, response, isComplete } = action.payload;

      const newMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: { intent },
      };

      // Map intent to transaction type
      const intentToType: Record<string, 'income' | 'expense' | undefined> = {
        create_expense: 'expense',
        create_income: 'income',
      };

      // If we have all data for a transaction, prepare confirmation
      if (isComplete && extractedData && (intent === 'create_expense' || intent === 'create_income')) {
        const transactionData: TransactionData = {
          amount: extractedData.amount as number,
          description: extractedData.description as string,
          date: (extractedData.date as string) || new Date().toISOString().split('T')[0],
          type: intentToType[intent] || 'expense',
          category: (extractedData.category as string) || 'other',
        };

        const pendingAction: PendingAction = {
          type: 'create_transaction',
          data: transactionData,
        };

        return {
          ...state,
          messages: [
            ...state.messages,
            {
              ...newMessage,
              content: formatConfirmationMessage(pendingAction),
              metadata: { ...newMessage.metadata, confirmationRequired: true },
            },
          ],
          pendingAction,
          currentFlow: null,
          collectedData: {},
        };
      }

      // Continue collecting data
      const newCollectedData: CollectedData = {
        ...state.collectedData,
        ...(extractedData as CollectedData),
      };

      // Set the flow based on intent if not already in one
      let currentFlow = state.currentFlow;
      if (!currentFlow && (intent === 'create_expense' || intent === 'create_income' || intent === 'create_budget' || intent === 'contribute_goal')) {
        currentFlow = intent as FlowType;
      }

      return {
        ...state,
        messages: [...state.messages, newMessage],
        currentFlow,
        collectedData: newCollectedData,
      };
    }

    case 'START_FLOW':
      return {
        ...state,
        currentFlow: action.payload,
        collectedData: {},
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: flowStartMessages[action.payload],
            timestamp: new Date(),
          },
        ],
      };

    case 'SET_PENDING_ACTION':
      return {
        ...state,
        pendingAction: action.payload,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: formatConfirmationMessage(action.payload),
            timestamp: new Date(),
            metadata: { confirmationRequired: true },
          },
        ],
      };

    case 'SET_RECEIPT_DATA': {
      const pendingAction: PendingAction = {
        type: 'create_transaction',
        data: action.payload,
      };

      return {
        ...state,
        pendingAction,
        currentFlow: null,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: formatConfirmationMessage(pendingAction),
            timestamp: new Date(),
            metadata: { confirmationRequired: true },
          },
        ],
      };
    }

    case 'ACTION_COMPLETED':
      return {
        ...state,
        pendingAction: null,
        currentFlow: null,
        collectedData: {},
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: '¡Listo! Se guardó correctamente. ¿Necesitás algo más?',
            timestamp: new Date(),
          },
        ],
      };

    case 'CANCEL_ACTION':
      return {
        ...state,
        pendingAction: null,
        currentFlow: null,
        collectedData: {},
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: 'Entendido, cancelé la operación. ¿En qué más puedo ayudarte?',
            timestamp: new Date(),
          },
        ],
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
