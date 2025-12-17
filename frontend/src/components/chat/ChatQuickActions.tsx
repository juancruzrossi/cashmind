'use client';

import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Target,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FlowType } from '@/lib/chat/types';

interface ChatQuickActionsProps {
  onSelect: (action: FlowType) => void;
}

const actions = [
  {
    type: 'create_expense' as FlowType,
    label: 'Gasto',
    icon: TrendingDown,
    color: 'text-red-400 hover:bg-red-500/10 border-red-500/20',
  },
  {
    type: 'create_income' as FlowType,
    label: 'Ingreso',
    icon: TrendingUp,
    color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20',
  },
  {
    type: 'create_budget' as FlowType,
    label: 'Presupuesto',
    icon: PiggyBank,
    color: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20',
  },
  {
    type: 'contribute_goal' as FlowType,
    label: 'Aportar meta',
    icon: Target,
    color: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20',
  },
  {
    type: 'analyze_receipt' as FlowType,
    label: 'Escanear ticket',
    icon: Camera,
    color: 'text-primary hover:bg-primary/10 border-primary/20',
  },
];

export function ChatQuickActions({ onSelect }: ChatQuickActionsProps) {
  return (
    <div className="py-2">
      <p className="text-xs text-muted-foreground mb-2">Acciones rápidas:</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.type}
            variant="outline"
            size="sm"
            className={`${action.color} text-xs h-8 px-3 bg-transparent`}
            onClick={() => onSelect(action.type)}
          >
            <action.icon className="size-3.5 mr-1.5" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
