'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePayslips } from '@/hooks/usePayslips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Pencil,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayslipUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface AnalyzedData {
  employer?: string;
  position?: string;
  period?: {
    month: string;
    year: number;
  };
  grossSalary?: number;
  netSalary?: number;
  deductions?: Array<{
    name: string;
    amount: number;
    percentage?: number;
    category: string;
  }>;
  bonuses?: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}

export function PayslipUploader({ open, onOpenChange }: PayslipUploaderProps) {
  const { analyzePayslip, addPayslip } = usePayslips();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [createTransaction, setCreateTransaction] = useState(true);

  // Editable fields
  const [editMode, setEditMode] = useState(false);
  const [employer, setEmployer] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [grossSalary, setGrossSalary] = useState(0);
  const [netSalary, setNetSalary] = useState(0);

  const handleAnalyze = async (file: File) => {
    setStatus('uploading');
    setProgress(20);
    setFileName(file.name);
    setError(null);

    try {
      setStatus('analyzing');
      setProgress(50);

      const result = await analyzePayslip(file);

      setProgress(80);

      if (!result.success || !result.data) {
        throw new Error('No se pudo extraer información del documento');
      }

      setAnalyzedData(result.data);
      setFileName(result.file_name || file.name);

      // Set editable fields
      setEmployer(result.data.employer || '');
      setMonth(result.data.period?.month || '');
      setYear(result.data.period?.year || new Date().getFullYear());
      setGrossSalary(result.data.grossSalary || 0);
      setNetSalary(result.data.netSalary || 0);

      setProgress(100);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleSave = async () => {
    if (!analyzedData) return;

    try {
      await addPayslip({
        month: month || analyzedData.period?.month || 'Desconocido',
        year: year || analyzedData.period?.year || new Date().getFullYear(),
        gross_salary: grossSalary || analyzedData.grossSalary || 0,
        net_salary: netSalary || analyzedData.netSalary || 0,
        employer: employer || analyzedData.employer,
        position: analyzedData.position,
        deductions: analyzedData.deductions?.map(d => ({
          name: d.name,
          amount: d.amount,
          percentage: d.percentage,
          category: d.category || 'other',
        })),
        bonuses: analyzedData.bonuses?.map(b => ({
          name: b.name,
          amount: b.amount,
          type: b.type || 'other',
        })),
        create_transaction: createTransaction,
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const resetAndClose = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setAnalyzedData(null);
    setFileName('');
    setEditMode(false);
    setCreateTransaction(true);
    setEmployer('');
    setMonth('');
    setYear(new Date().getFullYear());
    setGrossSalary(0);
    setNetSalary(0);
    onOpenChange(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleAnalyze(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled: status !== 'idle',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[600px] glass max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Analizar Recibo de Sueldo
          </DialogTitle>
          <DialogDescription>
            Sube tu recibo de sueldo y la IA extraerá automáticamente toda la información
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu recibo o haz clic'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, PNG o JPG (máx. 10MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <div className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">
                  {status === 'uploading' ? 'Subiendo archivo...' : 'Analizando con IA...'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
              </div>
              <Progress value={progress} className="w-full max-w-xs" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-medium text-destructive">Error al procesar</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={() => setStatus('idle')} variant="outline">
                Intentar de nuevo
              </Button>
            </div>
          </div>
        )}

        {status === 'success' && analyzedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-emerald-500">Análisis completado</p>
                  <p className="text-sm text-muted-foreground truncate">{fileName}</p>
                </div>
              </div>
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            </div>

            {editMode ? (
              <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Editar valores</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Empleador</Label>
                    <Input
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                      placeholder="Nombre del empleador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mes</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Año</Label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salario Bruto</Label>
                    <Input
                      type="number"
                      value={grossSalary}
                      onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salario Neto</Label>
                    <Input
                      type="number"
                      value={netSalary}
                      onChange={(e) => setNetSalary(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Empleador</p>
                      <p className="font-medium">{employer || analyzedData.employer || 'No detectado'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="font-medium">
                        {month || analyzedData.period?.month} {year || analyzedData.period?.year}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Salario Bruto</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        {formatCurrency(grossSalary || analyzedData.grossSalary || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Salario Neto</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(netSalary || analyzedData.netSalary || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {analyzedData.deductions && analyzedData.deductions.length > 0 && !editMode && (
              <div>
                <h4 className="text-sm font-medium mb-3">Deducciones</h4>
                <div className="space-y-2">
                  {analyzedData.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{d.name}</span>
                      <span className="text-sm font-medium text-red-500">
                        -{formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyzedData.bonuses && analyzedData.bonuses.length > 0 && !editMode && (
              <div>
                <h4 className="text-sm font-medium mb-3">Adicionales</h4>
                <div className="space-y-2">
                  {analyzedData.bonuses.map((b, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{b.name}</span>
                      <span className="text-sm font-medium text-emerald-500">
                        +{formatCurrency(b.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors",
                createTransaction ? "bg-primary/10 border border-primary/30" : "bg-secondary/30 border border-transparent"
              )}
              onClick={() => setCreateTransaction(!createTransaction)}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                createTransaction ? "bg-primary border-primary" : "border-muted-foreground"
              )}>
                {createTransaction && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium">Crear transacción de ingreso</p>
                <p className="text-xs text-muted-foreground">
                  Se creará automáticamente un ingreso de {formatCurrency(netSalary || analyzedData.netSalary || 0)} para {month || analyzedData.period?.month} {year || analyzedData.period?.year}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-chart-2">
                <FileText className="w-4 h-4 mr-2" />
                Guardar Recibo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
