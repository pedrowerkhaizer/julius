"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Plus, AlertCircle, CreditCard, LogOut, Settings, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, User2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

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
  recurrenceEndDate?: string;
  transactionIdOriginal?: string; // para exceções recorrentes
}

const today = new Date();

function getTodayISO() {
  return today.toISOString().split("T")[0];
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
  const router = useRouter();
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
  const [entryHasRecurrenceEndDate, setEntryHasRecurrenceEndDate] = useState(false);
  const [entryRecurrenceEndDate, setEntryRecurrenceEndDate] = useState("");

  // Formulário de saída
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(true);
  const [expenseDay, setExpenseDay] = useState(1);
  const [expenseDate, setExpenseDate] = useState(getTodayISO());
  const [expenseType, setExpenseType] = useState<"fixed" | "variable" | "subscription">("fixed");
  const [expenseHasRecurrenceEndDate, setExpenseHasRecurrenceEndDate] = useState(false);
  const [expenseRecurrenceEndDate, setExpenseRecurrenceEndDate] = useState("");
  
  // Campos específicos para assinatura
  const [subscriptionCard, setSubscriptionCard] = useState("");
  const [subscriptionBillingDay, setSubscriptionBillingDay] = useState(1);
  const [subscriptionCardDueDay, setSubscriptionCardDueDay] = useState(10);

  // Estado para dialog de detalhes dos KPIs
  const [openKpiDialog, setOpenKpiDialog] = useState<null | "income" | "expense" | "fixed" | "variable" | "subscription" | "performance">(
    null
  );

  // Estado do usuário
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Estados para edição/remoção
  const [editingEvent, setEditingEvent] = useState<Entry | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | null>(null); // para recorrente
  const [editingMode, setEditingMode] = useState<"single" | "all" | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exceptionOverrides, setExceptionOverrides] = useState<Record<string, any>>({}); // { occurrenceKey: { ...override } }
  const [exceptionDeletes, setExceptionDeletes] = useState<Record<string, boolean>>({}); // { occurrenceKey: true }

  // Estados para edição de campos
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);

  // Filtro de período
  const [period, setPeriod] = useState<"current" | "next" | "3months" | "custom">("current");
  const [customStart, setCustomStart] = useState(getTodayISO());
  const [customEnd, setCustomEnd] = useState(getTodayISO());

  // Calcula o range de datas conforme o filtro
  let rangeStart: Date, rangeEnd: Date;
  if (period === "current") {
    rangeStart = startOfMonth(today);
    rangeEnd = endOfMonth(today);
  } else if (period === "next") {
    const next = addMonths(today, 1);
    rangeStart = startOfMonth(next);
    rangeEnd = endOfMonth(next);
  } else if (period === "3months") {
    rangeStart = startOfMonth(today);
    rangeEnd = endOfMonth(addMonths(today, 2));
  } else {
    rangeStart = parseISO(customStart);
    rangeEnd = parseISO(customEnd);
  }

  // Função para buscar transações do Supabase e mapear para camelCase
  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      toast.error("Erro ao buscar transações");
    } else {
      // Mapeia os campos snake_case para camelCase
      const mapped = (data || []).map((t: any) => ({
        ...t,
        isRecurring: t.is_recurring,
        expenseType: t.expense_type,
        subscriptionCard: t.subscription_card,
        subscriptionBillingDay: t.subscription_billing_day,
        subscriptionCardDueDay: t.subscription_card_due_day,
        recurrenceEndDate: t.recurrence_end_date,
      }));
      setEvents(mapped);
    }
  }

  // Função para buscar exceções de recorrência do Supabase
  async function fetchRecurrenceExceptions() {
    const { data, error } = await supabase
      .from('recurrence_exceptions')
      .select('*');
    if (!error && data) {
      // Monta mapas para sobrescrever ou deletar ocorrências
      const overrides: Record<string, any> = {};
      const deletes: Record<string, boolean> = {};
      data.forEach((ex: any) => {
        const key = `${ex.transaction_id}_${ex.date}`;
        if (ex.action === 'edit') {
          if (!overrides[key] || new Date(ex.created_at) > new Date(overrides[key].created_at)) {
            overrides[key] = ex;
          }
        }
        if (ex.action === 'delete') deletes[key] = true;
      });
      setExceptionOverrides(overrides);
      setExceptionDeletes(deletes);
    }
  }

  // Carrega eventos do Supabase ao montar
  useEffect(() => {
    fetchTransactions();
    fetchRecurrenceExceptions();
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setUserLoading(false);
    }
    fetchUser();
  }, []);

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
  const handleAddEntry = async (e: React.FormEvent) => {
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
    console.log("[handleAddEntry] Iniciando inserção de entrada...");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.error("[handleAddEntry] Erro ao obter usuário:", userError);
      toast.error("Erro ao obter usuário autenticado");
      return;
    }
    const userId = userData.user.id;
    console.log("[handleAddEntry] user_id:", userId);
    const newEntry = {
      user_id: userId,
      description: entryDescription.trim(),
      amount: entryAmount,
      is_recurring: entryIsRecurring,
      type: "income",
      date: entryIsRecurring ? null : entryDate,
      day: entryIsRecurring ? entryDay : null,
      recurrence_end_date: entryIsRecurring && entryHasRecurrenceEndDate && entryRecurrenceEndDate ? entryRecurrenceEndDate : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log("[handleAddEntry] Payload para insert:", newEntry);
    const { data, error } = await supabase.from('transactions').insert([newEntry]).select();
    if (error) {
      console.error("[handleAddEntry] Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    } else {
      console.log("[handleAddEntry] Transação salva com sucesso:", data);
      // Atualiza o estado local com o id real do banco
      if (data && data[0]) {
        setEvents(prev => [...prev, {
          ...data[0],
          isRecurring: data[0].is_recurring,
          expenseType: data[0].expense_type,
          subscriptionCard: data[0].subscription_card,
          subscriptionBillingDay: data[0].subscription_billing_day,
          subscriptionCardDueDay: data[0].subscription_card_due_day,
          recurrenceEndDate: data[0].recurrence_end_date,
        }]);
      }
      toast.success("Transação salva!");
      await fetchTransactions(); // Refresh automático
      setEntryDescription("");
      setEntryAmount(0);
      setEntryDay(1);
      setEntryDate(getTodayISO());
      setEntryIsRecurring(true);
      setEntryHasRecurrenceEndDate(false);
      setEntryRecurrenceEndDate("");
      setShowEntryDialog(false);
    }
  };

  // Adiciona ou edita saída
  const handleAddExpense = async (e: React.FormEvent) => {
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
    console.log("[handleAddExpense] Iniciando inserção de saída...");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.error("[handleAddExpense] Erro ao obter usuário:", userError);
      toast.error("Erro ao obter usuário autenticado");
      return;
    }
    const userId = userData.user.id;
    console.log("[handleAddExpense] user_id:", userId);
    const isRecurring = expenseType === "subscription" ? true : expenseIsRecurring;
    const day = expenseType === "subscription" ? subscriptionBillingDay : (expenseIsRecurring ? expenseDay : null);
    const date = expenseType === "subscription" ? null : (!expenseIsRecurring ? expenseDate : null);
    const newExpense = {
      user_id: userId,
      description: expenseDescription.trim(),
      amount: expenseAmount,
      is_recurring: isRecurring,
      type: "expense",
      expense_type: expenseType,
      date: date,
      day: day,
      recurrence_end_date: isRecurring && expenseHasRecurrenceEndDate && expenseRecurrenceEndDate ? expenseRecurrenceEndDate : null,
      subscription_card: expenseType === "subscription" ? subscriptionCard : null,
      subscription_billing_day: expenseType === "subscription" ? subscriptionBillingDay : null,
      subscription_card_due_day: expenseType === "subscription" ? subscriptionCardDueDay : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log("[handleAddExpense] Payload para insert:", newExpense);
    const { data, error } = await supabase.from('transactions').insert([newExpense]).select();
    if (error) {
      console.error("[handleAddExpense] Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    } else {
      console.log("[handleAddExpense] Transação salva com sucesso:", data);
      // Atualiza o estado local com o id real do banco
      if (data && data[0]) {
        setEvents(prev => [...prev, {
          ...data[0],
          isRecurring: data[0].is_recurring,
          expenseType: data[0].expense_type,
          subscriptionCard: data[0].subscription_card,
          subscriptionBillingDay: data[0].subscription_billing_day,
          subscriptionCardDueDay: data[0].subscription_card_due_day,
          recurrenceEndDate: data[0].recurrence_end_date,
        }]);
      }
      toast.success("Transação salva!");
      await fetchTransactions(); // Refresh automático
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
    }
  };

  // Timeline: eventos do período selecionado
  const recurringEvents = events.filter(e => e.isRecurring).flatMap(event => {
    // Gera todas as ocorrências dentro do range
    const occurrences = [];
    let cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      if (event.recurrenceEndDate && new Date(event.recurrenceEndDate) < cursor) break;
      let dateObj: Date;
      if (event.expenseType === "subscription" && event.subscriptionBillingDay && event.subscriptionCardDueDay) {
        const billingDay = event.subscriptionBillingDay;
        const cardDueDay = event.subscriptionCardDueDay;
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        if (billingDay > cardDueDay) {
          dateObj = new Date(year, month + 1, billingDay);
        } else {
          dateObj = new Date(year, month, billingDay);
        }
      } else {
        dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), event.day!);
      }
      if (isWithinInterval(dateObj, { start: rangeStart, end: rangeEnd })) {
        const occurrenceKey = `${event.id}_${dateObj.toISOString().split("T")[0]}`;
        if (exceptionDeletes[occurrenceKey]) {
          cursor = addMonths(cursor, 1);
          continue;
        }
        const override = exceptionOverrides[occurrenceKey];
        if (override) {
          occurrences.push({
            ...event,
            ...override,
            description: override.override_description || event.description,
            amount: override.override_amount || event.amount,
            dateObj,
            dateStr: dateObj.toISOString().split("T")[0],
            isException: true,
            transactionIdOriginal: event.id,
          });
        } else {
          occurrences.push({
            ...event,
            dateObj,
            dateStr: dateObj.toISOString().split("T")[0],
            isException: false,
            transactionIdOriginal: event.id,
          });
        }
      }
      cursor = addMonths(cursor, 1);
    }
    return occurrences;
  });

  const singleEvents = events.filter(e => !e.isRecurring).map(event => ({
    ...event,
    dateObj: new Date(event.date!),
    dateStr: event.date!,
  }));

  // Só mostra únicas dentro do range
  const singleEventsInRange = singleEvents.filter(e => isWithinInterval(e.dateObj, { start: rangeStart, end: rangeEnd }));

  // Junta e ordena
  const allEvents = [...recurringEvents, ...singleEventsInRange];
  allEvents.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Resumo
  const totalIncome = allEvents.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = allEvents.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const totalFixedExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").reduce((sum, e) => sum + e.amount, 0);
  const totalVariableExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").reduce((sum, e) => sum + e.amount, 0);
  const totalSubscriptionExpense = allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").reduce((sum, e) => sum + e.amount, 0);

  // Novo KPI: performance do mês
  const monthPerformance = totalIncome - (totalFixedExpense + totalVariableExpense + totalSubscriptionExpense);

  // Função para abrir dialog de edição
  function handleEdit(event: Entry, occurrenceDate?: string) {
    console.log('[handleEdit] event:', event, 'occurrenceDate:', occurrenceDate);
    setEditingEvent(event);
    setEditingOccurrenceDate(occurrenceDate || null);
    setEditingMode(null);
    // Se for recorrente e tem exceção, preencher com override
    if (event.isRecurring && occurrenceDate) {
      const key = `${event.id}_${occurrenceDate}`;
      const override = exceptionOverrides[key];
      console.log('[handleEdit] override:', override);
      setEditDescription(override?.override_description || event.description);
      setEditAmount(override?.override_amount || event.amount);
    } else {
      setEditDescription(event.description || "");
      setEditAmount(event.amount || 0);
    }
    setShowEditDialog(true);
  }

  // Função para abrir dialog de remoção
  function handleDelete(event: Entry, occurrenceDate?: string) {
    setEditingEvent(event);
    setEditingOccurrenceDate(occurrenceDate || null);
    setEditingMode(null);
    setShowDeleteDialog(true);
  }

  // Função para salvar edição
  async function handleSaveEdit(edited: Partial<Entry>) {
    if (!editingEvent) return;
    console.log('[handleSaveEdit] editingEvent:', editingEvent, 'editingMode:', editingMode, 'editingOccurrenceDate:', editingOccurrenceDate, 'edited:', edited);
    if (editingEvent.isRecurring && editingMode === "single" && editingOccurrenceDate) {
      // 1. Buscar se já existe exceção para essa ocorrência
      const { data: existing, error: fetchError } = await supabase
        .from('recurrence_exceptions')
        .select('id')
        .eq('transaction_id', editingEvent.transactionIdOriginal || editingEvent.id)
        .eq('date', editingOccurrenceDate)
        .order('created_at', { ascending: false })
        .maybeSingle();
      console.log('[handleSaveEdit] existing exception:', existing, 'fetchError:', fetchError);
      if (existing?.id) {
        // Já existe: faz update
        const updatePayload = {
          action: 'edit',
          override_amount: edited.amount,
          override_description: edited.description,
          override_category: edited.expenseType,
        };
        const { error: updateError, data: updateData } = await supabase.from('recurrence_exceptions').update(updatePayload).eq('id', existing.id);
        console.log('[handleSaveEdit] update exception result:', updateData, 'updateError:', updateError);
        if (updateError) {
          toast.error('Erro ao atualizar exceção: ' + updateError.message);
          return;
        }
      } else {
        // Não existe: faz insert
        const insertPayload = {
          transaction_id: editingEvent.transactionIdOriginal || editingEvent.id, // id da transação do banco
          date: editingOccurrenceDate,
          action: 'edit',
          override_amount: edited.amount,
          override_description: edited.description,
          override_category: edited.expenseType,
        };
        const { error: insertError, data: insertData } = await supabase.from('recurrence_exceptions').insert([insertPayload]);
        console.log('[handleSaveEdit] insert result:', insertData, 'insertError:', insertError);
        if (insertError) {
          toast.error('Erro ao salvar exceção: ' + insertError.message);
          return;
        }
      }
    } else if (editingEvent.isRecurring && editingMode === "all") {
      // Atualiza transação principal
      const { error: updateError, data: updateData } = await supabase.from('transactions').update(edited).eq('id', editingEvent.transactionIdOriginal || editingEvent.id);
      console.log('[handleSaveEdit] update all result:', updateData, 'updateError:', updateError);
      if (updateError) {
        toast.error('Erro ao atualizar recorrência: ' + updateError.message);
        return;
      }
    } else {
      // Única
      const { error: updateError, data: updateData } = await supabase.from('transactions').update(edited).eq('id', editingEvent.transactionIdOriginal || editingEvent.id);
      console.log('[handleSaveEdit] update single result:', updateData, 'updateError:', updateError);
      if (updateError) {
        toast.error('Erro ao atualizar transação: ' + updateError.message);
        return;
      }
    }
    setShowEditDialog(false);
    setEditingEvent(null);
    setEditingOccurrenceDate(null);
    setEditingMode(null);
    await fetchTransactions();
    await fetchRecurrenceExceptions();
  }

  // Função para remover
  async function handleConfirmDelete() {
    if (!editingEvent) return;
    if (editingEvent.isRecurring && editingMode === "single" && editingOccurrenceDate) {
      // Cria exceção de delete para esta ocorrência
      await supabase.from('recurrence_exceptions').upsert([{
        transaction_id: editingEvent.transactionIdOriginal || editingEvent.id,
        date: editingOccurrenceDate,
        action: 'delete',
      }], { onConflict: 'transaction_id,date' });
    } else if (editingEvent.isRecurring && editingMode === "all") {
      // Remove transação principal
      await supabase.from('transactions').delete().eq('id', editingEvent.transactionIdOriginal || editingEvent.id);
    } else {
      // Única
      await supabase.from('transactions').delete().eq('id', editingEvent.transactionIdOriginal || editingEvent.id);
    }
    setShowDeleteDialog(false);
    setEditingEvent(null);
    setEditingOccurrenceDate(null);
    setEditingMode(null);
    await fetchTransactions();
    await fetchRecurrenceExceptions();
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Timeline de Eventos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe suas entradas e saídas recorrentes
            </p>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={v => setPeriod(v as any)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês atual</SelectItem>
                  <SelectItem value="next">Próximo mês</SelectItem>
                  <SelectItem value="3months">Próximos 3 meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {period === "custom" && (
                <>
                  <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-32" />
                  <span className="mx-1">até</span>
                  <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-32" />
                </>
              )}
            </div>
            {/* Botões de adicionar */}
            <div className="flex gap-2">
              <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>

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
                          <>
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
                            <div className="flex items-center gap-2 mt-2">
                              <Switch checked={entryHasRecurrenceEndDate} onCheckedChange={setEntryHasRecurrenceEndDate} id="hasRecurrenceEndDate" />
                              <label htmlFor="hasRecurrenceEndDate" className="text-sm">Tem data fim?</label>
                              {entryHasRecurrenceEndDate && (
                                <Input
                                  type="date"
                                  value={entryRecurrenceEndDate}
                                  onChange={e => setEntryRecurrenceEndDate(e.target.value)}
                                  min={getTodayISO()}
                                  className="w-40"
                                />
                              )}
                            </div>
                          </>
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
                      {expenseType !== "subscription" && expenseIsRecurring ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Switch checked={expenseHasRecurrenceEndDate} onCheckedChange={setExpenseHasRecurrenceEndDate} id="expenseHasRecurrenceEndDate" />
                          <label htmlFor="expenseHasRecurrenceEndDate" className="text-sm">Tem data fim?</label>
                          {expenseHasRecurrenceEndDate && (
                            <Input
                              type="date"
                              value={expenseRecurrenceEndDate}
                              onChange={e => setExpenseRecurrenceEndDate(e.target.value)}
                              min={getTodayISO()}
                              className="w-40"
                            />
                          )}
                        </div>
                      ) : null}
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
            {/* Avatar e menu do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="ml-2 cursor-pointer">
                  <Avatar>
                    <AvatarImage src={user?.user_metadata?.avatar_url || undefined} alt={user?.email || "avatar"} />
                    <AvatarFallback>
                      {user?.email ? user.email[0].toUpperCase() : <User2 className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  {user?.user_metadata?.full_name || user?.email || "Usuário"}
                </DropdownMenuLabel>
                <div className="px-3 pb-1 text-xs text-muted-foreground">
                  {user?.created_at && (
                    <>Membro desde {new Date(user.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ajustes')}>
                  <Settings className="w-4 h-4 mr-2" /> Ajustes do Usuário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 ">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {allEvents.filter(e => e.type === "income").length === 0 ? "Nenhuma entrada no período" : `${allEvents.filter(e => e.type === "income").length} entrada(s) no período`}
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
                {allEvents.filter(e => e.type === "expense").length === 0 ? "Nenhuma saída no período" : `${allEvents.filter(e => e.type === "expense").length} saída(s) no período`}
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
                {allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").length === 0 ? "Nenhuma despesa fixa no período" : `${allEvents.filter(e => e.type === "expense" && e.expenseType === "fixed").length} despesa(s) fixa(s) no período`}
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
                {allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").length === 0 ? "Nenhuma despesa variável no período" : `${allEvents.filter(e => e.type === "expense" && e.expenseType === "variable").length} despesa(s) variável(is) no período`}
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
                {allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").length === 0 ? "Nenhuma assinatura no período" : `${allEvents.filter(e => e.type === "expense" && e.expenseType === "subscription").length} assinatura(s) no período`}
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
                {monthPerformance > 0 ? "Saldo positivo no período" : monthPerformance < 0 ? "Saldo negativo no período" : "Equilíbrio no período"}
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
                  <div key={event.id + event.dateStr}>
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
                    <div className="flex gap-2 mt-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event, event.dateStr)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(event, event.dateStr)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de edição: mostrar opções se recorrente */}
        {showEditDialog && editingEvent && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
              </DialogHeader>
              {editingEvent.isRecurring ? (
                <div className="mb-4">
                  <Button variant={editingMode === "single" ? "default" : "outline"} onClick={() => setEditingMode("single")}>Só esta ocorrência</Button>
                  <Button variant={editingMode === "all" ? "default" : "outline"} onClick={() => setEditingMode("all")}>Toda a recorrência</Button>
                </div>
              ) : null}
              {/* Formulário de edição */}
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveEdit({ description: editDescription, amount: editAmount }); }}>
                <div>
                  <label className="block mb-1 font-medium">Descrição</label>
                  <Input
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Descrição"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Valor (R$)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editAmount}
                    onChange={e => setEditAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!editingMode}>Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de remoção: mostrar opções se recorrente */}
        {showDeleteDialog && editingEvent && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remover Transação</DialogTitle>
              </DialogHeader>
              {editingEvent.isRecurring ? (
                <div className="mb-4">
                  <Button variant={editingMode === "single" ? "default" : "outline"} onClick={() => setEditingMode("single")}>Só esta ocorrência</Button>
                  <Button variant={editingMode === "all" ? "default" : "outline"} onClick={() => setEditingMode("all")}>Toda a recorrência</Button>
                </div>
              ) : null}
              <Button onClick={handleConfirmDelete}>Confirmar Remoção</Button>
            </DialogContent>
          </Dialog>
        )}

        {/* Floating Action Button (FAB) para adicionar entrada/saída */}
        <div
          className="fixed left-1/2 bottom-8 z-30 flex gap-3 -translate-x-1/2"
        >
          <button
            onClick={() => setShowExpenseDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow px-5 py-3 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5" /> Nova Saída
          </button>
          <button
            onClick={() => setShowEntryDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-lime-500 hover:bg-lime-600 text-white shadow px-5 py-3 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5" /> Nova Entrada
          </button>
          
        </div>

        {/* Responsividade para mobile/tablet */}
        <style jsx global>{`
          @media (max-width: 640px) {
            .fixed.left-1\/2.bottom-8 {
              gap: 0.5rem;
              bottom: 1.25rem;
            }
            .fixed.left-1\/2.bottom-8 button {
              font-size: 0.95rem;
              padding: 0.7rem 1.1rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}