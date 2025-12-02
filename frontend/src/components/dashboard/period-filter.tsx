'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatLocalDate,
  getLocalToday,
  getLocalMonthStart,
  getLocalMonthEnd,
  getLocalYearStart,
  subtractDays,
} from '@/lib/date-utils';

export type PeriodType = 'current_month' | 'current_year' | 'last_365_days' | 'custom_month';

export interface PeriodValue {
  type: PeriodType;
  month?: number;
  year?: number;
}

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getDateRange(period: PeriodValue): { startDate: string; endDate: string } {
  const today = getLocalToday();
  const endDate = formatLocalDate(today);
  let startDate: string;

  switch (period.type) {
    case 'current_month':
      startDate = formatLocalDate(getLocalMonthStart(today));
      break;
    case 'current_year':
      startDate = formatLocalDate(getLocalYearStart(today));
      break;
    case 'last_365_days':
      startDate = formatLocalDate(subtractDays(today, 365));
      break;
    case 'custom_month':
      if (period.month !== undefined && period.year !== undefined) {
        const monthDate = new Date(period.year, period.month, 1);
        startDate = formatLocalDate(getLocalMonthStart(monthDate));
        return { startDate, endDate: formatLocalDate(getLocalMonthEnd(monthDate)) };
      }
      startDate = formatLocalDate(getLocalMonthStart(today));
      break;
    default:
      startDate = formatLocalDate(getLocalYearStart(today));
      break;
  }

  return { startDate, endDate };
}

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function getPeriodLabel(period: PeriodValue): string {
  switch (period.type) {
    case 'current_month':
      return 'Mes actual';
    case 'current_year':
      return 'Año corriente';
    case 'last_365_days':
      return 'Último año';
    case 'custom_month':
      if (period.month !== undefined && period.year !== undefined) {
        return `${MONTHS_SHORT[period.month]} ${period.year}`;
      }
      return 'Elegir mes';
    default:
      return 'Período';
  }
}

function MonthPicker({
  selectedMonth,
  selectedYear,
  onSelect
}: {
  selectedMonth?: number;
  selectedYear?: number;
  onSelect: (month: number, year: number) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(selectedYear || now.getFullYear());

  return (
    <div className="p-3 w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewYear(viewYear - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">{viewYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewYear(viewYear + 1)}
          disabled={viewYear >= now.getFullYear()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((month, index) => {
          const isFuture = viewYear === now.getFullYear() && index > now.getMonth();
          const isSelected = selectedMonth === index && selectedYear === viewYear;
          return (
            <Button
              key={month}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-9 text-xs',
                isFuture && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isFuture}
              onClick={() => onSelect(index, viewYear)}
            >
              {month.slice(0, 3)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const handleMonthSelect = (month: number, year: number) => {
    onChange({ type: 'custom_month', month, year });
    setMonthPickerOpen(false);
  };

  return (
    <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[160px] justify-start bg-[#12121a] border-[rgba(255,255,255,0.06)] hover:bg-white/[0.03] hover:border-primary/20"
        >
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="truncate text-sm">{getPeriodLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 border-b border-[rgba(255,255,255,0.04)]">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={value.type === 'current_month' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs justify-start"
              onClick={() => { onChange({ type: 'current_month' }); setMonthPickerOpen(false); }}
            >
              Mes actual
            </Button>
            <Button
              variant={value.type === 'current_year' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs justify-start"
              onClick={() => { onChange({ type: 'current_year' }); setMonthPickerOpen(false); }}
            >
              Año corriente
            </Button>
            <Button
              variant={value.type === 'last_365_days' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs justify-start col-span-2"
              onClick={() => { onChange({ type: 'last_365_days' }); setMonthPickerOpen(false); }}
            >
              Último año (365 días)
            </Button>
          </div>
        </div>
        <div className="p-2 border-t border-[rgba(255,255,255,0.04)]">
          <p className="text-xs text-muted-foreground mb-2 px-1">O elegí un mes:</p>
          <MonthPicker
            selectedMonth={value.type === 'custom_month' ? value.month : undefined}
            selectedYear={value.type === 'custom_month' ? value.year : undefined}
            onSelect={handleMonthSelect}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
