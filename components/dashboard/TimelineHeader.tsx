import { formatTimelineDate } from '@/lib/utils/dateUtils';

export interface TimelineHeaderProps {
  date: string;
}

export function TimelineHeader({ date }: TimelineHeaderProps) {
  return (
    <div className="px-4 py-3 bg-muted/30 border-b">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {formatTimelineDate(date)}
        </h3>
      </div>
    </div>
  );
} 