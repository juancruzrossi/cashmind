'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type Status = 'green' | 'yellow' | 'red';

interface HistoryDataPoint {
  month: string;
  month_date: string;
  overall_score: number;
  overall_status: Status;
  savings_rate_score: number;
  fixed_expenses_score: number;
  budget_adherence_score: number;
  trend_score: number;
}

interface HistoryResponse {
  history: HistoryDataPoint[];
  count: number;
}

const AXIS_COLOR = '#6a6a78';
const GRID_COLOR = 'rgba(255, 255, 255, 0.04)';

const STATUS_COLORS: Record<Status, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

function ChartSkeleton() {
  return (
    <Card className="glass">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <div className="w-full h-full flex flex-col justify-end gap-2 p-4">
            <Skeleton className="w-full h-32" />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-4 w-10" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: HistoryDataPoint }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const statusColor = STATUS_COLORS[data.overall_status];

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-lg font-bold">{data.overall_score}</span>
          <span className="text-muted-foreground">/ 100</span>
        </div>
      </div>
    );
  }
  return null;
};

export function HistoryChart() {
  const [data, setData] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistory = async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = (await api.getHealthScoreHistory()) as HistoryResponse;
      setData(response.history);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolución del Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="h-[250px] flex flex-col items-center justify-center gap-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolución del Score
          </CardTitle>
          <CardDescription>Historial de los últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Sin historial disponible</p>
            <p className="text-xs mt-1">El historial se genera cuando visitas esta página cada mes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestScore = data[data.length - 1]?.overall_score ?? 0;
  const firstScore = data[0]?.overall_score ?? 0;
  const scoreDiff = latestScore - firstScore;
  const trendText =
    scoreDiff > 0
      ? `+${scoreDiff} pts desde ${data[0].month}`
      : scoreDiff < 0
        ? `${scoreDiff} pts desde ${data[0].month}`
        : 'Sin cambios';

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolución del Score
            </CardTitle>
            <CardDescription>
              {data.length >= 2 ? trendText : 'Historial de los últimos 6 meses'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4a853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 40, 70, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
              <ReferenceLine
                y={70}
                stroke={STATUS_COLORS.green}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={40}
                stroke={STATUS_COLORS.red}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="overall_score"
                name="Score"
                stroke="#d4a853"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = STATUS_COLORS[payload.overall_status as Status];
                  return (
                    <circle
                      key={`dot-${payload.month_date}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={color}
                      stroke="#121216"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: '#121216', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.green }} />
            <span>Excelente (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.yellow }} />
            <span>Regular (40-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.red }} />
            <span>Atención (&lt;40)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
