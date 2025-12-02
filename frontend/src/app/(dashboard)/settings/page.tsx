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
  Info,
  Sparkles,
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
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <Card className="border-border/50 glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Cuenta</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Activo
            </Badge>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
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
            <div className="p-2 rounded-lg bg-chart-2/20">
              <Database className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <CardTitle>Datos</CardTitle>
              <CardDescription>Resumen de tus datos financieros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

      <Card className="border-border/50 glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-chart-3/20">
              <Sparkles className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <CardTitle>Acerca de CashMind</CardTitle>
              <CardDescription>Información de la aplicación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">CashMind</p>
              <p className="text-sm text-muted-foreground">Tu mente financiera personal</p>
            </div>
            <Badge>v1.0.0</Badge>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Características principales</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Análisis de recibos de sueldo con IA (Gemini)</li>
                  <li>• Seguimiento detallado de gastos e ingresos</li>
                  <li>• Presupuestos por categoría</li>
                  <li>• Metas financieras con seguimiento</li>
                  <li>• Multi-usuario con autenticación JWT</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
