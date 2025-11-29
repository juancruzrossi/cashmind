'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Target, PiggyBank, FileText } from 'lucide-react';

const actions = [
  {
    title: 'Nueva Transacción',
    description: 'Registra un ingreso o gasto',
    icon: Plus,
    href: '/dashboard/transactions?new=true',
    color: 'from-primary to-chart-2',
  },
  {
    title: 'Subir Recibo',
    description: 'Analiza tu recibo de sueldo',
    icon: Upload,
    href: '/dashboard/payslips?upload=true',
    color: 'from-chart-2 to-chart-5',
  },
  {
    title: 'Nueva Meta',
    description: 'Define un objetivo financiero',
    icon: Target,
    href: '/dashboard/goals?new=true',
    color: 'from-chart-3 to-amber-400',
  },
  {
    title: 'Nuevo Presupuesto',
    description: 'Crea un límite de gastos',
    icon: PiggyBank,
    href: '/dashboard/budgets?new=true',
    color: 'from-chart-4 to-pink-400',
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/50 glass">
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
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
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
