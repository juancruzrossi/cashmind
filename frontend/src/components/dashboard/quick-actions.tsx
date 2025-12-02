'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Target, PiggyBank, FileText } from 'lucide-react';

const actions = [
  {
    title: 'Transacción',
    description: 'Nuevo movimiento',
    icon: Plus,
    href: '/transactions?new=true',
    color: 'from-primary to-chart-2',
  },
  {
    title: 'Recibo',
    description: 'Analizar sueldo',
    icon: Upload,
    href: '/payslips?upload=true',
    color: 'from-chart-2 to-chart-5',
  },
  {
    title: 'Meta',
    description: 'Nuevo objetivo',
    icon: Target,
    href: '/goals?new=true',
    color: 'from-chart-3 to-amber-400',
  },
  {
    title: 'Presupuesto',
    description: 'Límite de gasto',
    icon: PiggyBank,
    href: '/budgets?new=true',
    color: 'from-chart-4 to-pink-400',
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/50 glass h-full">
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3 h-full">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="ghost"
                className="w-full h-auto flex-col items-start gap-2 p-4 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left w-full overflow-hidden">
                  <p className="font-medium text-sm truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
