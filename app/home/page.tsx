"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Plus, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Tipo para entrada/saída
interface Entry {
  id: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  day?: number; // para recorrente
  date?: string; // para única
  type: "income" | "expense";
  expenseType?: "fixed" | "variable" | "subscription"; // novo campo para tipo de despesa
  // Campos específicos para assinatura
  subscriptionCard?: string;
  subscriptionBillingDay?: number;
  subscriptionCardDueDay?: number;
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
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

export default function EventsPage() {
  // Entradas e saídas
  const [events, setEvents] = useState<Entry[]>([]);

  // Dialogs
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  // Formulário de entrada
  const [entryDescription, setEntryDescription] = useState("");
  const [entryAmount, setEntryAmount] = useState(0);
  const [entryIsRecurring, setEntryIsRecurring] = useState(true);
  const [entryDay, setEntryDay] = useState(1);
  const [entryDate, setEntryDate] = useState(getTodayISO());

  // Formulário de saída
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(true);
  const [expenseDay, setExpenseDay] = useState(1);
  const [expenseDate, setExpenseDate] = useState(getTodayISO());
  const [expenseType, setExpenseType] = useState<"fixed" | "variable" | "subscription">("fixed");
  
  // Campos específicos para assinatura
  const [subscriptionCard, setSubscriptionCard] = useState("");
  const [subscriptionBillingDay, setSubscriptionBillingDay] = useState(1);
  const [subscriptionCardDueDay, setSubscriptionCardDueDay] = useState(10);

  // Estado para dialog de detalhes dos KPIs
  const [openKpiDialog, setOpenKpiDialog] = useState<null | "income" | "expense" | "fixed" | "variable" | "subscription" | "performance">(
    null
  );

  // Carrega eventos do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("julius_events");
      if (saved) {
        setEvents(JSON.parse(saved));
      }
    }
  }, []);

  // Salva eventos no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("julius_events", JSON.stringify(events));
    }
  }, [events]);

  // Função para calcular a data efetiva da assinatura
  const calculateSubscriptionDate = (billingDay: number, cardDueDay: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se a data de cobrança é depois do vencimento do cartão, vai para o próximo mês
    if (billingDay > cardDueDay) {
      const nextMonth = new Date(currentYear, currentMonth + 1, billingDay);
      return nextMonth;
    } else {
      return new Date(currentYear, currentMonth, billingDay);
    }
  };

  // Adiciona ou edita entrada
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDescription.trim() || !entryAmount || entryAmount <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (entryIsRecurring && (!entryDay || entryDay < 1 || entryDay > 28)) {
      toast.error("Selecione o dia do mês para recorrente");
      return;
    }
    if (!entryIsRecurring && !entryDate) {
      toast.error("Selecione a data da entrada única");
      return;
    }
    const newEntry: Entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      description: entryDescription.trim(),
      amount: entryAmount,
      isRecurring: entryIsRecurring,
      type: "income",
      ...(entryIsRecurring ? { day: entryDay } : { date: entryDate }),
    };
    setEvents(prev => [...prev, newEntry]);
    setEntryDescription("");
    setEntryAmount(0);
    setEntryDay(1);
    setEntryDate(getTodayISO());
    setEntryIsRecurring(true);
    setShowEntryDialog(false);
  };

  // Adiciona ou edita saída
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescription.trim() || !expenseAmount || expenseAmount <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (expenseType === "subscription") {
      if (!subscriptionCard) {
        toast.error("Selecione o cartão da assinatura");
        return;
      }
      if (!subscriptionBillingDay || subscriptionBillingDay < 1 || subscriptionBillingDay > 28) {
        toast.error("Selecione a data de cobrança da assinatura");
        return;
      }
      if (!subscriptionCardDueDay || subscriptionCardDueDay < 1 || subscriptionCardDueDay > 28) {
        toast.error("Selecione a data de vencimento do cartão");
        return;
      }
    } else {
      if (expenseIsRecurring && (!expenseDay || expenseDay < 1 || expenseDay > 28)) {
        toast.error("Selecione o dia do mês para recorrente");
        return;
      }
      if (!expenseIsRecurring && !expenseDate) {
        toast.error("Selecione a data da saída única");
        return;
      }
    }
    const isRecurring = expenseType === "subscription" ? true : expenseIsRecurring;
    const day = expenseType === "subscription" ? subscriptionBillingDay : (expenseIsRecurring ? expenseDay : undefined);
    const date = expenseType === "subscription" ? undefined : (!expenseIsRecurring ? expenseDate : undefined);
    const newExpense: Entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      description: expenseDescription.trim(),
      amount: expenseAmount,
      isRecurring,
      type: "expense",
      expenseType: expenseType,
      ...(day ? { day } : {}),
      ...(date ? { date } : {}),
      ...(expenseType === "subscription" && {
        subscriptionCard,
        subscriptionBillingDay,
        subscriptionCardDueDay,
      }),
    };
    setEvents(prev => [...prev, newExpense]);
    setExpenseDescription("");
    setExpenseAmount(0);
    setExpenseDay(1);
    setExpenseDate(getTodayISO());
    setExpenseIsRecurring(true);
    setExpenseType("fixed");
    setSubscriptionCard("");
    setSubscriptionBillingDay(1);
    setSubscriptionCardDueDay(10);
    setShowExpenseDialog(false);
  };

  // Timeline: eventos do mês atual (recorrentes) + únicas do mês
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const recurringEvents = events.filter(e => e.isRecurring).map(event => {
    let dateObj: Date;
    
    if (event.expenseType === "subscription" && event.subscriptionBillingDay && event.subscriptionCardDueDay) {
      // Para assinaturas, calcula a data baseada na lógica de cobrança vs vencimento
      dateObj = calculateSubscriptionDate(event.subscriptionBillingDay, event.subscriptionCardDueDay);
    } else {
      // Para outros tipos, usa o dia normal
      dateObj = new Date(currentYear, currentMonth, event.day!);
    }
    
    return {
      ...event,
      dateObj,
      dateStr: dateObj.toISOString().split("T")[0],
    };
  });
  
  const singleEvents = events.filter(e => !e.isRecurring).map(event => ({
    ...event,
    dateObj: new Date(event.date!),
    dateStr: event.date!,
  }));
  
  // Só mostra únicas do mês atual
  const singleEventsThisMonth = singleEvents.filter(e => {
    const d = e.dateObj;
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  // Junta e ordena
  const allEvents = [...recurringEvents, ...singleEventsThisMonth];
  allEvents.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Resumo
  const totalIncome = allEvents.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = allEvents.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const totalFixedExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").reduce((sum, e) => sum + e.amount, 0);
  const totalVariableExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").reduce((sum, e) => sum + e.amount, 0);
  const totalSubscriptionExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").reduce((sum, e) => sum + e.amount, 0);

  // Novo KPI: performance do mês
  const monthPerformance = totalIncome - (totalFixedExpense + totalVariableExpense + totalSubscriptionExpense);

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Timeline de Eventos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe suas entradas e saídas recorrentes
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
              <DialogTrigger asChild>
                <Button className="bg-lime-500 hover:bg-lime-600">
                  <Plus className="w-4 h-4 mr-2" /> Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Nova Entrada</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <form onSubmit={handleAddEntry} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 font-medium">Descrição</label>
                        <Input
                          value={entryDescription}
                          onChange={e => setEntryDescription(e.target.value)}
                          placeholder="Ex: Salário, Projeto X, etc"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium">Valor (R$)</label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={entryAmount}
                          onChange={e => setEntryAmount(Number(e.target.value))}
                          placeholder="Ex: 3500.00"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 font-medium">Tipo de entrada</label>
                        <Select value={entryIsRecurring ? "recorrente" : "unica"} onValueChange={v => setEntryIsRecurring(v === "recorrente")}> 
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recorrente">Recorrente</SelectItem>
                            <SelectItem value="unica">Única</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {entryIsRecurring ? (
                        <div>
                          <label className="block mb-1 font-medium">Dia do mês</label>
                          <Select value={entryDay.toString()} onValueChange={v => setEntryDay(Number(v))}>
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
                          <label className="block mb-1 font-medium">Data da entrada</label>
                          <Input
                            type="date"
                            value={entryDate}
                            onChange={e => setEntryDate(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0">
                  <Button type="button" variant="outline" onClick={() => setShowEntryDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-lime-500 hover:bg-lime-600" onClick={handleAddEntry}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Plus className="w-4 h-4 mr-2" /> Nova Saída
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Nova Saída</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 font-medium">Descrição</label>
                        <Input
                          value={expenseDescription}
                          onChange={e => setExpenseDescription(e.target.value)}
                          placeholder="Ex: Aluguel, Energia, etc"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium">Valor (R$)</label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(Number(e.target.value))}
                          placeholder="Ex: 1200.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">Tipo de despesa</label>
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

                    {/* Campos específicos para assinatura */}
                    {expenseType === "subscription" && (
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
                          <label className="block mb-1 font-medium text-sm">Vencimento do cartão</label>
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

                    {/* Tipo de saída e dia/data só aparecem se NÃO for assinatura */}
                    {expenseType !== "subscription" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1 font-medium">Tipo de saída</label>
                          <Select value={expenseIsRecurring ? "recorrente" : "unica"} onValueChange={v => setExpenseIsRecurring(v === "recorrente")}> 
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recorrente">Recorrente</SelectItem>
                              <SelectItem value="unica">Única</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {expenseIsRecurring ? (
                          <div>
                            <label className="block mb-1 font-medium">Dia do mês</label>
                            <Select value={expenseDay.toString()} onValueChange={v => setExpenseDay(Number(v))}>
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
                            <label className="block mb-1 font-medium">Data da saída</label>
                            <Input
                              type="date"
                              value={expenseDate}
                              onChange={e => setExpenseDate(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0">
                  <Button type="button" variant="outline" onClick={() => setShowExpenseDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-red-500 hover:bg-red-600" onClick={handleAddExpense}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs - responsivo: 1/2/3 por linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card onClick={() => setOpenKpiDialog("income")} className="cursor-pointer hover:ring-2 hover:ring-lime-400 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-lime-500" />
                <CardTitle className="text-lg">Entradas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalIncome)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {events.filter(e => e.type === "income").length === 0 ? "Nenhuma entrada cadastrada" : `${events.filter(e => e.type === "income").length} entrada(s) cadastrada(s)`}
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => setOpenKpiDialog("expense")} className="cursor-pointer hover:ring-2 hover:ring-red-400 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">Saídas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalExpense)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {events.filter(e => e.type === "expense").length === 0 ? "Nenhuma saída cadastrada" : `${events.filter(e => e.type === "expense").length} saída(s) cadastrada(s)`}
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => setOpenKpiDialog("fixed")} className="cursor-pointer hover:ring-2 hover:ring-orange-400 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Fixas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalFixedExpense)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {events.filter(e => e.type === "expense" && e.expenseType === "fixed").length === 0 ? "Nenhuma despesa fixa" : `${events.filter(e => e.type === "expense" && e.expenseType === "fixed").length} despesa(s) fixa(s)`}
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => setOpenKpiDialog("variable")} className="cursor-pointer hover:ring-2 hover:ring-purple-400 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Variáveis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalVariableExpense)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {events.filter(e => e.type === "expense" && e.expenseType === "variable").length === 0 ? "Nenhuma despesa variável" : `${events.filter(e => e.type === "expense" && e.expenseType === "variable").length} despesa(s) variável(is)`}
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => setOpenKpiDialog("subscription")} className="cursor-pointer hover:ring-2 hover:ring-blue-400 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Assinaturas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalSubscriptionExpense)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {events.filter(e => e.type === "expense" && e.expenseType === "subscription").length === 0 ? "Nenhuma assinatura" : `${events.filter(e => e.type === "expense" && e.expenseType === "subscription").length} assinatura(s)`}
              </p>
            </CardContent>
          </Card>
          {/* KPI Performance do mês */}
          <Card onClick={() => setOpenKpiDialog("performance")} className="cursor-pointer hover:ring-2 hover:ring-lime-600 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full flex items-center justify-center" style={{ background: monthPerformance > 0 ? '#22c55e' : monthPerformance < 0 ? '#ef4444' : '#64748b' }}>
                  <span className="text-white font-bold">{monthPerformance > 0 ? '+' : monthPerformance < 0 ? '-' : '='}</span>
                </span>
                <CardTitle className="text-lg">Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthPerformance > 0 ? 'text-lime-500' : monthPerformance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(monthPerformance)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {monthPerformance > 0 ? "Saldo positivo no mês" : monthPerformance < 0 ? "Saldo negativo no mês" : "Equilíbrio no mês"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs de detalhes dos KPIs */}
        <Dialog open={openKpiDialog === "income"} onOpenChange={v => setOpenKpiDialog(v ? "income" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes das Entradas</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">Soma de todas as entradas do mês.</div>
            <ul className="space-y-1">
              {allEvents.filter(e => e.type === "income").length === 0 ? (
                <li className="text-muted-foreground">Nenhuma entrada cadastrada</li>
              ) : (
                allEvents.filter(e => e.type === "income").map(e => (
                  <li key={e.id}>
                    <span className="font-medium">{e.description}</span>: R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
        <Dialog open={openKpiDialog === "expense"} onOpenChange={v => setOpenKpiDialog(v ? "expense" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes das Saídas</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">Soma de todas as saídas do mês (fixas, variáveis e assinaturas).</div>
            <ul className="space-y-1">
              {allEvents.filter(e => e.type === "expense").length === 0 ? (
                <li className="text-muted-foreground">Nenhuma saída cadastrada</li>
              ) : (
                allEvents.filter(e => e.type === "expense").map(e => (
                  <li key={e.id}>
                    <span className="font-medium">{e.description}</span>: R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <span className="text-xs text-muted-foreground">({e.expenseType === "fixed" ? "Fixa" : e.expenseType === "variable" ? "Variável" : "Assinatura"})</span>
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
        <Dialog open={openKpiDialog === "fixed"} onOpenChange={v => setOpenKpiDialog(v ? "fixed" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes das Despesas Fixas</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">Soma de todas as despesas fixas do mês.</div>
            <ul className="space-y-1">
              {allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").length === 0 ? (
                <li className="text-muted-foreground">Nenhuma despesa fixa cadastrada</li>
              ) : (
                allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").map(e => (
                  <li key={e.id}>
                    <span className="font-medium">{e.description}</span>: R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
        <Dialog open={openKpiDialog === "variable"} onOpenChange={v => setOpenKpiDialog(v ? "variable" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes das Despesas Variáveis</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">Soma de todas as despesas variáveis do mês.</div>
            <ul className="space-y-1">
              {allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").length === 0 ? (
                <li className="text-muted-foreground">Nenhuma despesa variável cadastrada</li>
              ) : (
                allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").map(e => (
                  <li key={e.id}>
                    <span className="font-medium">{e.description}</span>: R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
        <Dialog open={openKpiDialog === "subscription"} onOpenChange={v => setOpenKpiDialog(v ? "subscription" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes das Assinaturas</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">Soma de todas as assinaturas do mês.</div>
            <ul className="space-y-1">
              {allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").length === 0 ? (
                <li className="text-muted-foreground">Nenhuma assinatura cadastrada</li>
              ) : (
                allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").map(e => (
                  <li key={e.id}>
                    <span className="font-medium">{e.description}</span>: R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <span className="text-xs text-muted-foreground">({creditCards.find(c => c.id === e.subscriptionCard)?.name || "Cartão"})</span>
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
        <Dialog open={openKpiDialog === "performance"} onOpenChange={v => setOpenKpiDialog(v ? "performance" : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Performance do Mês</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">
              Performance = Entradas - (Fixas + Variáveis + Assinaturas)
            </div>
            <ul className="mb-2">
              <li>Entradas: <span className="font-medium">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></li>
              <li>Fixas: <span className="font-medium">R$ {totalFixedExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></li>
              <li>Variáveis: <span className="font-medium">R$ {totalVariableExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></li>
              <li>Assinaturas: <span className="font-medium">R$ {totalSubscriptionExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></li>
            </ul>
            <div className="font-bold">
              Resultado: R$ {monthPerformance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Timeline de eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {allEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum evento cadastrado
                </div>
              ) : (
                allEvents.map(event => (
                  <div key={event.id}>
                    <div className="px-4 py-3 bg-muted/30 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {event.dateObj.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {event.dateObj.toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
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
                            {event.type === "expense" && event.expenseType && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                event.expenseType === "fixed" 
                                  ? "bg-orange-100 text-orange-700" 
                                  : event.expenseType === "variable"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {event.expenseType === "fixed" ? "Fixa" : event.expenseType === "variable" ? "Variável" : "Assinatura"}
                              </span>
                            )}
                            {event.type === "expense" && event.expenseType === "subscription" && event.subscriptionCard && (
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                {creditCards.find(c => c.id === event.subscriptionCard)?.name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {event.isRecurring
                              ? event.type === "income"
                                ? "Entrada recorrente"
                                : "Saída recorrente"
                              : event.type === "income"
                                ? "Entrada única"
                                : "Saída única"}
                            {event.type === "expense" && event.expenseType === "subscription" && event.subscriptionBillingDay && event.subscriptionCardDueDay && (
                              <span className="ml-2">
                                • Cobrança: dia {event.subscriptionBillingDay} • Vencimento: dia {event.subscriptionCardDueDay}
                              </span>
                            )}
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}