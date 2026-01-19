'use client';

import { RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AdvicePanelProps {
  advice: string | null;
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
  onRetry: () => void;
}

const DEFAULT_ADVICE = `• Revisa tus gastos del mes para identificar áreas de mejora.
• Considera establecer un presupuesto para cada categoría.
• Intenta ahorrar al menos el 20% de tus ingresos mensuales.`;

function AdviceSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function AdvicePanel({
  advice,
  isLoading,
  isRegenerating,
  error,
  onRegenerate,
  onRetry,
}: AdvicePanelProps) {
  const displayAdvice = advice || DEFAULT_ADVICE;

  if (error && !advice) {
    return (
      <div className="glass rounded-xl p-6" role="alert" aria-live="assertive">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Error al cargar consejos
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#d4a853]/10">
            <Lightbulb className="w-5 h-5 text-[#d4a853]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Consejos Personalizados
            </h3>
            <p className="text-xs text-muted-foreground">
              Basados en tu situación financiera actual
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isLoading || isRegenerating}
          className="shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`}
          />
          {isRegenerating ? 'Generando...' : 'Regenerar'}
        </Button>
      </div>

      <div role="status" aria-live="polite">
        {isLoading && !advice ? (
          <AdviceSkeleton />
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {displayAdvice}
            </div>
          </div>
        )}
      </div>

      {error && advice && (
        <p className="text-xs text-red-400 mt-3">
          Error al regenerar: {error}
        </p>
      )}
    </div>
  );
}
