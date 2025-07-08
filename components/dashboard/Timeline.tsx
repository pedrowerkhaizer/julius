import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineHeader } from './TimelineHeader';
import { TimelineEvent } from './TimelineEvent';
import { TimelineEvent as TimelineEventData } from '@/hooks/useTimeline';

export interface TimelineProps {
  events: TimelineEventData[];
  groupedEvents: Array<{ date: string; events: TimelineEventData[] }>;
  creditCards: Array<{ id: string; name: string }>;
  loading: boolean;
  onEdit: (event: TimelineEventData, occurrenceDate?: string) => void;
  onDelete: (event: TimelineEventData, occurrenceDate?: string) => void;
}

export function Timeline({ 
  events, 
  groupedEvents, 
  creditCards, 
  loading, 
  onEdit, 
  onDelete 
}: TimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-12 text-muted-foreground">
            Nenhum evento cadastrado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {groupedEvents.map(({ date, events: dayEvents }) => (
            <div key={date}>
              <TimelineHeader date={date} />
              {dayEvents.map(event => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  creditCards={creditCards}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 