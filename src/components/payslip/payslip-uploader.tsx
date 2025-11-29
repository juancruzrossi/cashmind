'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFinanceStore } from '@/store/finance-store';
import { Button } from '@/components/ui/button';
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
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PayslipData, Deduction, Bonus } from '@/types';

interface PayslipUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

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
  const { addPayslip } = useFinanceStore();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const analyzePayslip = async (file: File) => {
    setStatus('uploading');
    setProgress(20);
    setFileName(file.name);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setStatus('analyzing');
      setProgress(50);

      const response = await fetch('/api/payslip/analyze', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error('Error al analizar el documento');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.parseError || 'No se pudo extraer información del documento');
      }

      setAnalyzedData(result.data);
      setProgress(100);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleSave = () => {
    if (!analyzedData) return;

    const payslipData: PayslipData = {
      id: crypto.randomUUID(),
      month: analyzedData.period?.month || 'Desconocido',
      year: analyzedData.period?.year || new Date().getFullYear(),
      uploadDate: new Date().toISOString(),
      fileName: fileName,
      grossSalary: analyzedData.grossSalary || 0,
      netSalary: analyzedData.netSalary || 0,
      deductions: (analyzedData.deductions || []).map((d): Deduction => ({
        name: d.name,
        amount: d.amount,
        percentage: d.percentage,
        category: (d.category as Deduction['category']) || 'other',
      })),
      bonuses: (analyzedData.bonuses || []).map((b): Bonus => ({
        name: b.name,
        amount: b.amount,
        type: (b.type as Bonus['type']) || 'other',
      })),
      employer: analyzedData.employer,
      position: analyzedData.position,
    };

    addPayslip(payslipData);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setAnalyzedData(null);
    setFileName('');
    onOpenChange(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      analyzePayslip(file);
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-500">Análisis completado</p>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Empleador</p>
                  <p className="font-medium">{analyzedData.employer || 'No detectado'}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">
                    {analyzedData.period?.month} {analyzedData.period?.year}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Salario Bruto</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatCurrency(analyzedData.grossSalary || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Salario Neto</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(analyzedData.netSalary || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {analyzedData.deductions && analyzedData.deductions.length > 0 && (
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

            {analyzedData.bonuses && analyzedData.bonuses.length > 0 && (
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
