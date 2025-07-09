import { useMemo } from 'react';
import { Transaction } from '@/lib/types/finance';
import { addMonths, isWithinInterval, parseISO } from 'date-fns';

export interface TimelineEvent {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  expenseType?: 'fixed' | 'variable' | 'subscription';
  dateObj: Date;
  dateStr: string;
  isRecurring: boolean;
  transactionIdOriginal: string;
  subscriptionCard?: string;
  subscriptionBillingDay?: number;
  subscriptionCardDueDay?: number;
}

export interface UseTimelineProps {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date };
  loading: boolean;
}

export function useTimeline({ transactions, dateRange, loading }: UseTimelineProps) {
  const timelineEvents = useMemo(() => {
    if (loading) return [];

    const recurringEvents = transactions
      .filter(t => t.is_recurring)
      .flatMap(transaction => {
        const occurrences: TimelineEvent[] = [];
        let cursor = new Date(dateRange.start);
        
        while (cursor <= dateRange.end) {
          if (transaction.recurrence_end_date && new Date(transaction.recurrence_end_date) < cursor) {
            break;
          }
          
          let dateObj: Date;
          
          if (transaction.expense_type === "subscription" && transaction.subscription_billing_day && transaction.subscription_card_due_day) {
            const cardDueDay = transaction.subscription_card_due_day;
            const year = cursor.getFullYear();
            const month = cursor.getMonth();
            dateObj = new Date(year, month, cardDueDay, 12); // Meio-dia para evitar fuso
          } else {
            dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), transaction.day!, 12); // Meio-dia para evitar fuso
          }
          
          if (isWithinInterval(dateObj, { start: dateRange.start, end: dateRange.end })) {
            occurrences.push({
              id: `${transaction.id}-${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              expenseType: transaction.expense_type,
              dateObj,
              dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
              isRecurring: true,
              transactionIdOriginal: transaction.id,
              subscriptionCard: transaction.subscription_card,
              subscriptionBillingDay: transaction.subscription_billing_day,
              subscriptionCardDueDay: transaction.subscription_card_due_day,
            });
          }
          
          cursor = addMonths(cursor, 1);
        }
        
        return occurrences;
      });

    const singleEvents = transactions
      .filter(t => !t.is_recurring && t.date)
      .map(transaction => ({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        expenseType: transaction.expense_type,
        dateObj: parseISO(transaction.date!),
        dateStr: transaction.date!,
        isRecurring: false,
        transactionIdOriginal: transaction.id,
        subscriptionCard: transaction.subscription_card,
        subscriptionBillingDay: transaction.subscription_billing_day,
        subscriptionCardDueDay: transaction.subscription_card_due_day,
      }))
      .filter(event => isWithinInterval(event.dateObj, { start: dateRange.start, end: dateRange.end }));

    const allEvents = [...recurringEvents, ...singleEvents];
    allEvents.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return allEvents;
  }, [transactions, dateRange, loading]);

  // Group events by date for timeline display
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    timelineEvents.forEach(event => {
      const dateKey = event.dateStr;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => ({
        date,
        events: events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      }));
  }, [timelineEvents]);

  return {
    timelineEvents,
    groupedEvents,
    loading
  };
} 