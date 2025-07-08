import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PeriodFilter } from '@/lib/types/finance';

export interface PeriodFilterProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customStart: string;
  onCustomStartChange: (date: string) => void;
  customEnd: string;
  onCustomEndChange: (date: string) => void;
}

export function PeriodFilterComponent({ 
  period, 
  onPeriodChange, 
  customStart, 
  onCustomStartChange, 
  customEnd, 
  onCustomEndChange 
}: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Período:</span>
        <Select value={period} onValueChange={v => onPeriodChange(v as PeriodFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Atual</SelectItem>
            <SelectItem value="next">Próximo</SelectItem>
            <SelectItem value="3months">3 Meses</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {period === "custom" && (
        <>
          <Input 
            type="date" 
            value={customStart} 
            onChange={e => onCustomStartChange(e.target.value)} 
            className="w-32" 
          />
          <span className="mx-1">até</span>
          <Input 
            type="date" 
            value={customEnd} 
            onChange={e => onCustomEndChange(e.target.value)} 
            className="w-32" 
          />
        </>
      )}
    </div>
  );
} 