import { TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineEvent as TimelineEventType } from '@/hooks/useTimeline';

export interface TimelineEventProps {
  event: TimelineEventType;
  creditCards: Array<{ id: string; name: string }>;
  onEdit: (event: TimelineEventType, occurrenceDate?: string) => void;
  onDelete: (event: TimelineEventType, occurrenceDate?: string) => void;
}

export function TimelineEvent({ event, creditCards, onEdit, onDelete }: TimelineEventProps) {
  const getExpenseTypeBadge = (expenseType?: string) => {
    if (!expenseType) return null;
    
    const badgeClasses = {
      fixed: "bg-orange-100 text-orange-700",
      variable: "bg-purple-100 text-purple-700",
      subscription: "bg-blue-100 text-blue-700"
    };
    
    const typeLabels = {
      fixed: "Fixa",
      variable: "Variável", 
      subscription: "Assinatura"
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeClasses[expenseType as keyof typeof badgeClasses]}`}>
        {typeLabels[expenseType as keyof typeof typeLabels]}
      </span>
    );
  };

  const getSubscriptionCardBadge = () => {
    if (event.type !== 'expense' || event.expenseType !== 'subscription' || !event.subscriptionCard) {
      return null;
    }
    
    const cardName = creditCards.find(c => c.id === event.subscriptionCard)?.name;
    if (!cardName) return null;
    
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
        {cardName}
      </span>
    );
  };

  const getSubscriptionInfo = () => {
    if (event.type !== 'expense' || event.expenseType !== 'subscription' || 
        !event.subscriptionBillingDay || !event.subscriptionCardDueDay) {
      return null;
    }
    
    return (
      <span className="ml-2">
        • Cobrança: dia {event.subscriptionBillingDay} • Vencimento: dia {event.subscriptionCardDueDay}
      </span>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {event.type === "income" ? (
              <TrendingUp className="w-4 h-4 text-lime-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium">{event.description}</span>
            {getExpenseTypeBadge(event.expenseType)}
            {getSubscriptionCardBadge()}
          </div>
          <div className="text-xs text-muted-foreground">
            {event.isRecurring
              ? event.type === "income"
                ? "Entrada recorrente"
                : "Saída recorrente"
              : event.type === "income"
                ? "Entrada única"
                : "Saída única"}
            {getSubscriptionInfo()}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${event.type === "income" ? "text-lime-600" : "text-red-600"}`}>
            {event.type === "income" ? "+" : "-"}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(event.amount)}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onEdit(event, event.dateStr)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(event, event.dateStr)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 