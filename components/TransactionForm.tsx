"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

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

interface Transaction {
  id?: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  day?: number;
  date?: string;
  type: "income" | "expense";
  expenseType?: "fixed" | "variable" | "subscription";
  subscriptionCard?: string;
  subscriptionBillingDay?: number;
  subscriptionCardDueDay?: number;
  recurrenceEndDate?: string;
}

interface TransactionFormProps {
  type: "income" | "expense";
  transactions: Transaction[];
  onTransactionsChange: (transactions: Transaction[]) => void;
  showAddAnother?: boolean;
  onAddAnother?: () => void;
  onCancel?: () => void;
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function TransactionForm({
  type,
  transactions,
  onTransactionsChange,
  showAddAnother = false,
  onAddAnother,
  onCancel
}: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(true);
  const [day, setDay] = useState(1);
  const [date, setDate] = useState(getTodayISO());
  const [expenseType, setExpenseType] = useState<"fixed" | "variable" | "subscription">("fixed");
  const [hasRecurrenceEndDate, setHasRecurrenceEndDate] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  
  // Campos específicos para assinatura
  const [subscriptionCard, setSubscriptionCard] = useState("");
  const [subscriptionBillingDay, setSubscriptionBillingDay] = useState(1);
  const [subscriptionCardDueDay, setSubscriptionCardDueDay] = useState(10);

  const handleAdd = () => {
    if (!description.trim() || !amount || amount <= 0) {
      return;
    }

    if (type === "expense" && expenseType === "subscription") {
      if (!subscriptionCard) return;
      if (!subscriptionBillingDay || subscriptionBillingDay < 1 || subscriptionBillingDay > 28) return;
      if (!subscriptionCardDueDay || subscriptionCardDueDay < 1 || subscriptionCardDueDay > 28) return;
    } else {
      if (isRecurring && (!day || day < 1 || day > 28)) return;
      if (!isRecurring && !date) return;
    }

    const newTransaction: Transaction = {
      description: description.trim(),
      amount,
      isRecurring: type === "expense" && expenseType === "subscription" ? true : isRecurring,
      type,
      day: type === "expense" && expenseType === "subscription" ? subscriptionBillingDay : (isRecurring ? day : undefined),
      date: type === "expense" && expenseType === "subscription" ? undefined : (!isRecurring ? date : undefined),
      expenseType: type === "expense" ? expenseType : undefined,
      subscriptionCard: type === "expense" && expenseType === "subscription" ? subscriptionCard : undefined,
      subscriptionBillingDay: type === "expense" && expenseType === "subscription" ? subscriptionBillingDay : undefined,
      subscriptionCardDueDay: type === "expense" && expenseType === "subscription" ? subscriptionCardDueDay : undefined,
      recurrenceEndDate: (type === "expense" && expenseType === "subscription" ? true : isRecurring) && hasRecurrenceEndDate && recurrenceEndDate ? recurrenceEndDate : undefined,
    };

    onTransactionsChange([...transactions, newTransaction]);
    
    // Reset form
    setDescription("");
    setAmount(0);
    setDay(1);
    setDate(getTodayISO());
    setIsRecurring(true);
    setExpenseType("fixed");
    setHasRecurrenceEndDate(false);
    setRecurrenceEndDate("");
    setSubscriptionCard("");
    setSubscriptionBillingDay(1);
    setSubscriptionCardDueDay(10);
  };

  const handleRemove = (index: number) => {
    onTransactionsChange(transactions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Lista de transações já cadastradas */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Transações cadastradas:</h4>
          <ul className="space-y-2">
            {transactions.map((transaction, index) => (
              <li key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">
                    R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {transaction.isRecurring && transaction.day && ` • Dia ${transaction.day}`}
                    {!transaction.isRecurring && transaction.date && ` • ${new Date(transaction.date).toLocaleDateString('pt-BR')}`}
                    {transaction.expenseType && ` • ${transaction.expenseType === "fixed" ? "Fixa" : transaction.expenseType === "variable" ? "Variável" : "Assinatura"}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulário para nova transação */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Nova {type === "income" ? "receita" : "despesa"}:</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Ex: ${type === "income" ? "Salário, Projeto X" : "Aluguel, Energia"}`}
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Tipo de despesa (apenas para expenses) */}
        {type === "expense" && (
          <div>
            <Label>Tipo de despesa</Label>
            <Select value={expenseType} onValueChange={v => setExpenseType(v as "fixed" | "variable" | "subscription")}>
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

        {/* Campos específicos para assinatura */}
        {type === "expense" && expenseType === "subscription" && (
          <div className="space-y-4 p-4 border border-muted rounded-lg">
            <h4 className="font-medium">Configuração da Assinatura</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Cartão da assinatura</Label>
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
                <Label className="text-sm">Data de cobrança</Label>
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
              <Label className="text-sm">Vencimento do cartão</Label>
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

        {/* Tipo de transação e dia/data só aparecem se NÃO for assinatura */}
        {!(type === "expense" && expenseType === "subscription") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de {type === "income" ? "receita" : "despesa"}</Label>
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
                <Label>Dia do mês</Label>
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
                <Label>Data da {type === "income" ? "receita" : "despesa"}</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Data fim da recorrência */}
        {(type === "expense" && expenseType === "subscription") || (isRecurring && type !== "expense") ? (
          <div className="flex items-center gap-2">
            <Switch checked={hasRecurrenceEndDate} onCheckedChange={setHasRecurrenceEndDate} id="hasRecurrenceEndDate" />
            <Label htmlFor="hasRecurrenceEndDate" className="text-sm">Tem data fim?</Label>
            {hasRecurrenceEndDate && (
              <Input
                type="date"
                value={recurrenceEndDate}
                onChange={e => setRecurrenceEndDate(e.target.value)}
                min={getTodayISO()}
                className="w-40"
              />
            )}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={handleAdd} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar {type === "income" ? "Receita" : "Despesa"}
          </Button>
          {showAddAnother && onAddAnother && (
            <Button onClick={onAddAnother} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar outra
            </Button>
          )}
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 