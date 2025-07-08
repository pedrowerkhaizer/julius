import { KPIData } from '@/hooks/useKPIs';
import { KPICard } from './KPICard';
import { Skeleton } from '@/components/ui/skeleton';

export interface KPIGridProps {
  kpis: KPIData[];
  onKPIClick: (key: string) => void;
  loading: boolean;
}

export function KPIGrid({ kpis, onKPIClick, loading }: KPIGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {kpis.map(kpi => (
        <KPICard
          key={kpi.key}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          color={kpi.color}
          subtitle={kpi.subtitle}
          onClick={() => onKPIClick(kpi.key)}
        />
      ))}
    </div>
  );
} 