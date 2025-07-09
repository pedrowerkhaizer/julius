import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreateTransactionData } from '@/lib/types/finance';
import { toast } from 'sonner';

export interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'income' | 'expense';
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  loading?: boolean;
  expenseType?: 'fixed' | 'variable' | 'subscription'; // NOVO
}

// Lista de cartões para assinaturas
const creditCards = [
  { id: "nubank", name: "Nubank" },
  { id: "itau", name: "Itaú" },
  { id: "bradesco", name: "Bradesco" },
  { id: "santander", name: "Santander" },
  { id: "bb", name: "Banco do Brasil" },
  { id: "caixa", name: "Caixa Econômica" },
  { id: "inter", name: "Banco Inter" },
  { id: "c6", name: "C6 Bank" },
  { id: "picpay", name: "PicPay" },
  { id: "mercadopago", name: "Mercado Pago" },
  { id: "outro", name: "Outro" },
];

export function TransactionDialog({ 
  open, 
  onOpenChange, 
  type, 
  onSubmit, 
  loading = false,
  expenseType: initialExpenseType // NOVO
}: TransactionDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(true);
  const [day, setDay] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasRecurrenceEndDate, setHasRecurrenceEndDate] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable' | 'subscription'>(initialExpenseType || 'fixed');
  const [subscriptionCard, setSubscriptionCard] = useState('');
  const [subscriptionBillingDay, setSubscriptionBillingDay] = useState(1);
  const [subscriptionCardDueDay, setSubscriptionCardDueDay] = useState(10);

  // Atualizar expenseType se prop mudar
  useEffect(() => {
    if (type === 'expense' && initialExpenseType) {
      setExpenseType(initialExpenseType);
    }
  }, [initialExpenseType, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!description.trim()) {
      toast.error('Preencha a descrição.');
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Preencha um valor válido.');
      return;
    }
    if (type === 'expense' && expenseType === 'subscription') {
      if (!subscriptionCard) {
        toast.error('Selecione o cartão da assinatura.');
        return;
      }
      if (!subscriptionBillingDay || subscriptionBillingDay < 1 || subscriptionBillingDay > 28) {
        toast.error('Selecione a data de cobrança.');
        return;
      }
      if (!subscriptionCardDueDay || subscriptionCardDueDay < 1 || subscriptionCardDueDay > 28) {
        toast.error('Selecione o dia de vencimento do cartão.');
        return;
      }
    }

    let transactionData: CreateTransactionData;
    if (type === 'expense' && expenseType === 'subscription') {
      transactionData = {
        description,
        amount: Number(amount),
        is_recurring: true,
        type,
        day: subscriptionCardDueDay, // Dia do mês = vencimento do cartão
        expense_type: 'subscription',
        subscription_card: subscriptionCard,
        subscription_billing_day: subscriptionBillingDay,
        subscription_card_due_day: subscriptionCardDueDay,
        recurrence_end_date: hasRecurrenceEndDate ? recurrenceEndDate : undefined,
      };
    } else {
      transactionData = {
        description,
        amount: Number(amount),
        is_recurring: isRecurring,
        type,
        day: isRecurring ? day : undefined,
        date: !isRecurring ? date : undefined,
        recurrence_end_date: hasRecurrenceEndDate ? recurrenceEndDate : undefined,
      };
      if (type === 'expense') {
        transactionData.expense_type = expenseType;
      }
    }

    console.log('Enviando transação:', transactionData);
    try {
      await onSubmit(transactionData);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar transação.');
      return;
    }
    // Reset form
    setDescription('');
    setAmount(0);
    setIsRecurring(true);
    setDay(1);
    setDate(new Date().toISOString().split('T')[0]);
    setHasRecurrenceEndDate(false);
    setRecurrenceEndDate('');
    setExpenseType('fixed');
    setSubscriptionCard('');
    setSubscriptionBillingDay(1);
    setSubscriptionCardDueDay(10);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Nova {type === 'income' ? 'Entrada' : 'Saída'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Descrição</label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={type === 'income' ? "Ex: Salário, Projeto X, etc" : "Ex: Aluguel, Energia, etc"}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="Ex: 3500.00"
                  required
                />
              </div>
            </div>

            {type === 'expense' && (
              <div>
                <label className="block mb-1 font-medium">Tipo de despesa</label>
                <Select value={expenseType} onValueChange={v => setExpenseType(v as 'fixed' | 'variable' | 'subscription')}> 
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixa</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                    <SelectItem value="subscription">Assinatura</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Diferença entre os tipos:</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div><strong>Fixa:</strong> Valor constante (aluguel, energia, internet)</div>
                      <div><strong>Variável:</strong> Valor que pode mudar (combustível, lazer, vestuário)</div>
                      <div><strong>Assinatura:</strong> Cobrança recorrente em cartão (Netflix, Spotify, etc)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Só mostra tipo de saída e dia do mês se não for assinatura */}
            {!(type === 'expense' && expenseType === 'subscription') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">
                    Tipo de {type === 'income' ? 'entrada' : 'saída'}
                  </label>
                  <Select value={isRecurring ? "recorrente" : "unica"} onValueChange={v => setIsRecurring(v === "recorrente")}> 
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recorrente">Recorrente</SelectItem>
                      <SelectItem value="unica">Única</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isRecurring ? (
                  <div>
                    <label className="block mb-1 font-medium">Dia do mês</label>
                    <Select value={day.toString()} onValueChange={v => setDay(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <label className="block mb-1 font-medium">
                      Data da {type === 'income' ? 'entrada' : 'saída'}
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Só mostra 'Tem data fim?' se não for assinatura */}
            {isRecurring && !(type === 'expense' && expenseType === 'subscription') && (
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={hasRecurrenceEndDate} 
                  onCheckedChange={setHasRecurrenceEndDate} 
                  id="hasRecurrenceEndDate" 
                />
                <label htmlFor="hasRecurrenceEndDate" className="text-sm">
                  Tem data fim?
                </label>
                {hasRecurrenceEndDate && (
                  <Input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={e => setRecurrenceEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-40"
                  />
                )}
              </div>
            )}

            {/* Campos específicos para assinatura */}
            {type === 'expense' && expenseType === "subscription" && (
              <div className="space-y-4 p-4 border border-muted rounded-lg">
                <h4 className="font-medium">Configuração da Assinatura</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-sm">Cartão da assinatura</label>
                    <Select value={subscriptionCard} onValueChange={setSubscriptionCard}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        {creditCards.map(card => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-sm">Data de cobrança</label>
                    <Select value={subscriptionBillingDay.toString()} onValueChange={v => setSubscriptionBillingDay(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-sm">Dia de vencimento do cartão</label>
                  <Select value={subscriptionCardDueDay.toString()} onValueChange={v => setSubscriptionCardDueDay(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className={type === 'income' ? 'bg-lime-500 hover:bg-lime-600' : 'bg-red-500 hover:bg-red-600'} 
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 