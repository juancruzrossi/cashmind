'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useFinanceStore } from '@/store/finance-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Shield,
  Database,
  Trash2,
  Download,
  Upload,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { transactions, payslips, budgets, goals } = useFinanceStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      transactions,
      payslips,
      budgets,
      goals,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashmind-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
  };

  const handleClearData = () => {
    localStorage.removeItem('cashmind-storage');
    window.location.reload();
  };

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
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Activo
            </Badge>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
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
              <CardDescription>Gestiona tus datos financieros</CardDescription>
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

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Datos
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Datos
            </Button>
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
                  <li>• Reportes y gráficos avanzados</li>
                  <li>• Datos almacenados localmente</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Exportar Datos
            </DialogTitle>
            <DialogDescription>
              Se descargará un archivo JSON con todos tus datos
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
            <p className="text-sm">El archivo incluirá:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {transactions.length} transacciones</li>
              <li>• {payslips.length} recibos de sueldo</li>
              <li>• {budgets.length} presupuestos</li>
              <li>• {goals.length} metas</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} className="bg-gradient-to-r from-primary to-chart-2">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Todos los Datos
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm">
              Se eliminarán permanentemente:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Todas las transacciones</li>
              <li>• Todos los recibos de sueldo</li>
              <li>• Todos los presupuestos</li>
              <li>• Todas las metas</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
