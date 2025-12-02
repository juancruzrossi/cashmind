'use client';

import { useAuth } from '@/lib/auth-context';
import { useTransactions } from '@/hooks/useTransactions';
import { usePayslips } from '@/hooks/usePayslips';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Database,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { transactions } = useTransactions();
  const { payslips } = usePayslips();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <Card className="border-border/50 glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Cuenta</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'Sin email'}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Activo
            </Badge>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Datos</CardTitle>
              <CardDescription>Resumen de tus datos financieros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-3xl font-bold">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transacciones</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-3xl font-bold">{payslips.length}</p>
              <p className="text-sm text-muted-foreground">Recibos</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-3xl font-bold">{budgets.length}</p>
              <p className="text-sm text-muted-foreground">Presupuestos</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-3xl font-bold">{goals.length}</p>
              <p className="text-sm text-muted-foreground">Metas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
