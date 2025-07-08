import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CreditCard, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  title: string;
  value: number;
  icon: string;
  color: 'lime' | 'red' | 'blue' | 'orange' | 'purple';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

const iconMap = {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard,
  Building2,
};

const colorMap = {
  lime: 'hover:ring-lime-400 text-lime-500',
  red: 'hover:ring-red-400 text-red-500',
  blue: 'hover:ring-blue-400 text-blue-500',
  orange: 'hover:ring-orange-400 text-orange-500',
  purple: 'hover:ring-purple-400 text-purple-500',
};

export function KPICard({ 
  title, 
  value, 
  icon, 
  color, 
  onClick, 
  loading = false, 
  subtitle 
}: KPICardProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap] || AlertCircle;
  const colorClasses = colorMap[color];

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted rounded mb-2" />
          <div className="h-4 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick} 
      className={cn(
        'cursor-pointer transition',
        onClick && colorClasses
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <IconComponent className={cn('w-5 h-5', colorClasses)} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value)}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
} 