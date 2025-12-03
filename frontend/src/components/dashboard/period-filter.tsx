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

export type PeriodType = 'current_month' | 'current_year' | 'last_365_days' | 'custom_month' | 'custom_year';

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
  let startDate: string;
  let endDate: string;

  switch (period.type) {
    case 'current_month':
      startDate = formatLocalDate(getLocalMonthStart(today));
      endDate = formatLocalDate(getLocalMonthEnd(today));
      break;
    case 'current_year':
      startDate = formatLocalDate(getLocalYearStart(today));
      endDate = formatLocalDate(new Date(today.getFullYear(), 11, 31));
      break;
    case 'last_365_days':
      startDate = formatLocalDate(subtractDays(today, 365));
      endDate = formatLocalDate(today);
      break;
    case 'custom_month':
      if (period.month !== undefined && period.year !== undefined) {
        const monthDate = new Date(period.year, period.month, 1);
        startDate = formatLocalDate(getLocalMonthStart(monthDate));
        endDate = formatLocalDate(getLocalMonthEnd(monthDate));
      } else {
        startDate = formatLocalDate(getLocalMonthStart(today));
        endDate = formatLocalDate(getLocalMonthEnd(today));
      }
      break;
    case 'custom_year':
      if (period.year !== undefined) {
        startDate = formatLocalDate(new Date(period.year, 0, 1));
        endDate = formatLocalDate(new Date(period.year, 11, 31));
      } else {
        startDate = formatLocalDate(getLocalYearStart(today));
        endDate = formatLocalDate(new Date(today.getFullYear(), 11, 31));
      }
      break;
    default:
      startDate = formatLocalDate(getLocalYearStart(today));
      endDate = formatLocalDate(new Date(today.getFullYear(), 11, 31));
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
    case 'custom_year':
      if (period.year !== undefined) {
        return `Año ${period.year}`;
      }
      return 'Elegir año';
    default:
      return 'Período';
  }
}

function YearPicker({
  selectedYear,
  onSelect
}: {
  selectedYear?: number;
  onSelect: (year: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(selectedYear || currentYear);

  const years = Array.from({ length: 6 }, (_, i) => viewYear - i);

  const handleSelect = (year: number) => {
    setViewYear(year);
    onSelect(year);
  };

  return (
    <div className="w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewYear(viewYear - 6)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">{selectedYear || currentYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewYear(Math.min(viewYear + 6, currentYear))}
          disabled={viewYear >= currentYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? 'default' : 'ghost'}
            size="sm"
            className="h-9 text-xs"
            onClick={() => handleSelect(year)}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
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
    <div className="w-[280px]">
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
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleMonthSelect = (month: number, year: number) => {
    onChange({ type: 'custom_month', month, year });
    setPickerOpen(false);
  };

  const handleYearSelect = (year: number) => {
    onChange({ type: 'custom_year', year });
    setPickerOpen(false);
  };

  return (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
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
              onClick={() => { onChange({ type: 'current_month' }); setPickerOpen(false); }}
            >
              Mes actual
            </Button>
            <Button
              variant={value.type === 'current_year' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs justify-start"
              onClick={() => { onChange({ type: 'current_year' }); setPickerOpen(false); }}
            >
              Año corriente
            </Button>
            <Button
              variant={value.type === 'last_365_days' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs justify-start col-span-2"
              onClick={() => { onChange({ type: 'last_365_days' }); setPickerOpen(false); }}
            >
              Último año (365 días)
            </Button>
          </div>
        </div>
        <div className="p-2 border-b border-[rgba(255,255,255,0.04)]">
          <p className="text-xs text-muted-foreground mb-2 px-1">O elegí un año completo:</p>
          <YearPicker
            selectedYear={value.type === 'custom_year' ? value.year : undefined}
            onSelect={handleYearSelect}
          />
        </div>
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-2 px-1">O elegí un mes específico:</p>
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
