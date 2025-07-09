"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Transaction } from "@/lib/types/finance";
import { CREDIT_CARDS } from "@/lib/utils/constants";

// Custom hooks
import { useKPIs } from "@/hooks/useKPIs";
import { useTimeline } from "@/hooks/useTimeline";
import { useTransactions } from "@/hooks/useTransactions";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCreditCards } from '@/hooks/useCreditCards';

// Layout components
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButtons } from "@/components/layout/FloatingActionButtons";

// Dashboard components
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { Timeline } from "@/components/dashboard/Timeline";
import { PeriodFilterComponent } from "@/components/dashboard/PeriodFilter";
import { CreditCardInvoices } from '@/components/credit-cards/CreditCardInvoices';

// Dialog components
import { TransactionDialog } from "@/components/dialogs/TransactionDialog";
import { EditTransactionDialog } from "@/components/dialogs/EditTransactionDialog";
import { DeleteTransactionDialog } from "@/components/dialogs/DeleteTransactionDialog";
import { KPIDetailsDialog } from "@/components/dialogs/KPIDetailsDialog";

// Converter CREDIT_CARDS para array mutável
const creditCardsArray = CREDIT_CARDS.map(card => ({ id: card.id, name: card.name }));

export default function EventsPage() {
  const router = useRouter();
  
  // Custom hooks
  const { profile: user, loading: userLoading } = useUserProfile();
  const { 
    accounts: bankAccounts, 
    addAccount, 
    updateAccount, 
    deleteAccount 
  } = useBankAccounts();
  const { 
    transactions, 
    loading: transactionsLoading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    updateRecurrenceException,
    deleteRecurrenceException
  } = useTransactions();

  // Local state
  const [period, setPeriod] = useState<'current' | 'next' | '3months' | 'custom'>('current');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  
  // Dialog states
  const [showContextualDialog, setShowContextualDialog] = useState<{ open: boolean, type: 'income' | 'expense', expenseType?: 'fixed' | 'variable' | 'subscription' }>({ open: false, type: 'income' });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openKpiDialog, setOpenKpiDialog] = useState<string | null>(null);
  
  // Edit/Delete states
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Estado para projeção
  const [projectionDate, setProjectionDate] = useState(new Date().toISOString().split('T')[0]);

  // Cartões de crédito e faturas
  const [userId, setUserId] = useState<string | null>(null);
  const {
    cards: creditCards,
    getInvoices,
    upsertInvoice
  } = useCreditCards(userId || '');
  const [cardInvoices, setCardInvoices] = useState<Record<string, any[]>>({});
  const [invoicesLoading, setInvoicesLoading] = useState<Record<string, boolean>>({});

  // Buscar userId ao carregar user
  useEffect(() => {
    if (user?.id) setUserId(user.id);
  }, [user]);

  // Buscar faturas ao carregar cartões
  useEffect(() => {
    if (!userId) return;
    creditCards.forEach(card => {
      if (!cardInvoices[card.id]) {
        setInvoicesLoading(prev => ({ ...prev, [card.id]: true }));
        getInvoices(card.id).then(invoices => {
          setCardInvoices(prev => ({ ...prev, [card.id]: invoices }));
        }).finally(() => setInvoicesLoading(prev => ({ ...prev, [card.id]: false })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditCards, userId]);

  // Função para salvar/editar fatura
  const handleSaveInvoice = async (cardId: string, invoice: { month: string; value: number }) => {
    if (!userId) return;
    setInvoicesLoading(prev => ({ ...prev, [cardId]: true }));
    try {
      await upsertInvoice({
        user_id: userId,
        credit_card_id: cardId,
        month: invoice.month,
        value: invoice.value,
      });
      // Atualizar faturas após salvar
      const invoices = await getInvoices(cardId);
      setCardInvoices(prev => ({ ...prev, [cardId]: invoices }));
    } finally {
      setInvoicesLoading(prev => ({ ...prev, [cardId]: false }));
    }
  };

  // Calcular saldo projetado baseado na data selecionada
  const projectedBalance = (() => {
    const totalAccountBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Filtrar transações de hoje até a data de projeção
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const projectionDateObj = new Date(projectionDate);
    projectionDateObj.setHours(23, 59, 59, 999);

    let projectedIncome = 0;
    let projectedExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.is_recurring && transaction.day) {
        // Gerar todas as ocorrências entre hoje e a data de projeção
        let cursor = new Date(today);
        while (cursor <= projectionDateObj) {
          const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), transaction.day);
          if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
            if (transaction.type === 'income') projectedIncome += transaction.amount;
            if (transaction.type === 'expense') projectedExpense += transaction.amount;
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      } else if (transaction.date) {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= today && transactionDate <= projectionDateObj) {
          if (transaction.type === 'income') projectedIncome += transaction.amount;
          if (transaction.type === 'expense') projectedExpense += transaction.amount;
        }
      }
    });

    // Somar faturas de cartão de crédito cujo vencimento está entre hoje e a data de projeção
    let projectedInvoices = 0;
    creditCards.forEach(card => {
      const invoices = cardInvoices[card.id] || [];
      invoices.forEach(invoice => {
        // Calcular data de vencimento da fatura
        const [year, month] = invoice.month.split('-').map(Number);
        const dueDate = new Date(year, month - 1, card.due_day, 12); // Meio-dia para evitar fuso
        if (dueDate >= today && dueDate <= projectionDateObj) {
          projectedInvoices += invoice.value;
        }
      });
    });

    return totalAccountBalance + projectedIncome - projectedExpense - projectedInvoices;
  })();

  // Juntar todas as invoices de todos os cartões
  const allInvoices = Object.values(cardInvoices).flat();

  // Chamada única de useKPIs, passando todas as invoices
  const { kpis, dateRange, loading: kpisLoading } = useKPIs({
    transactions,
    bankAccounts,
    period,
    customStart,
    customEnd,
    loading: transactionsLoading,
    invoices: allInvoices // Passa todas as invoices
  });

  // Sincronizar projectionDate com o período selecionado (agora depois de dateRange)
  useEffect(() => {
    let newProjectionDate = projectionDate;
    if (period === 'custom') {
      // customEnd já é string, garantir formato yyyy-mm-dd
      newProjectionDate = customEnd;
    } else if (dateRange?.end) {
      // dateRange.end é Date
      newProjectionDate = dateRange.end.toISOString().split('T')[0];
    }
    if (newProjectionDate !== projectionDate) {
      setProjectionDate(newProjectionDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd, dateRange?.end]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // Handlers
  const handleAddIncome = async (data: any) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    console.log('handleAddIncome chamado', data);
    try {
      await addTransaction({ ...data, user_id: user.id });
      setShowContextualDialog({ open: false, type: 'income' });
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const handleAddExpense = async (data: any) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    console.log('handleAddExpense chamado', data);
    try {
      await addTransaction({ ...data, user_id: user.id });
      setShowContextualDialog({ open: false, type: 'expense' });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEdit = (event: any, occurrenceDate?: string) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    setEditingEvent({ ...event, occurrenceDate });
    setShowEditDialog(true);
  };

  const handleDelete = (event: any, occurrenceDate?: string) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    setEditingEvent({ ...event, occurrenceDate });
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = async (data: any, mode: 'single' | 'all') => {
    if (!editingEvent) return;
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    try {
      if (mode === 'single' && editingEvent.occurrenceDate) {
        await updateRecurrenceException(
          editingEvent.transactionIdOriginal,
          editingEvent.occurrenceDate,
          data
        );
      } else {
        await updateTransaction(editingEvent.transactionIdOriginal, data);
      }
      setShowEditDialog(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleConfirmDelete = async (mode: 'single' | 'all') => {
    if (!editingEvent) return;
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    try {
      if (mode === 'single' && editingEvent.occurrenceDate) {
        await deleteRecurrenceException(
          editingEvent.transactionIdOriginal,
          editingEvent.occurrenceDate
        );
      } else {
        await deleteTransaction(editingEvent.transactionIdOriginal);
      }
      setShowDeleteDialog(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleLogout = () => {
    // This will be handled by the PageHeader component
  };

  // Handlers para contas bancárias
  const handleAddAccount = async (data: any) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    try {
      await addAccount(data);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleUpdateAccount = async (id: string, data: any) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    try {
      await updateAccount(id, data);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (userLoading || !user?.id) {
      toast.error('Aguarde, carregando usuário...');
      return;
    }
    try {
      await deleteAccount(id);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const { timelineEvents, groupedEvents, loading: timelineLoading } = useTimeline({
    transactions,
    dateRange,
    loading: transactionsLoading,
    invoices: allInvoices, // NOVO
    creditCards // NOVO
  });

  const loading = userLoading || transactionsLoading || kpisLoading || timelineLoading;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        user={user} 
        userLoading={userLoading} 
        onLogout={handleLogout} 
      />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Period Filter */}
        <PeriodFilterComponent
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          onCustomStartChange={setCustomStart}
          customEnd={customEnd}
          onCustomEndChange={setCustomEnd}
        />

        {/* KPI Grid */}
        <KPIGrid
          kpis={kpis}
          onKPIClick={setOpenKpiDialog}
          loading={loading}
          projectedBalance={projectedBalance}
          projectedSubtitle={`Até ${new Date(projectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}.`}
        />

        {/* Timeline */}
        <Timeline
          events={timelineEvents}
          groupedEvents={groupedEvents}
          creditCards={creditCardsArray}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Dialogs */}
        <EditTransactionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          event={editingEvent}
          onSave={handleSaveEdit}
          loading={transactionsLoading}
        />

        <DeleteTransactionDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          event={editingEvent}
          onConfirm={handleConfirmDelete}
          loading={transactionsLoading}
        />

        <KPIDetailsDialog
          open={!!openKpiDialog}
          onOpenChange={(open) => setOpenKpiDialog(open ? openKpiDialog : null)}
          kpiKey={openKpiDialog}
          events={timelineEvents}
          creditCards={creditCardsArray}
          bankAccounts={bankAccounts}
          onAddAccount={handleAddAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
          projectedBalance={projectedBalance}
          onProjectionDateChange={setProjectionDate}
          projectionDate={projectionDate}
          onEditEvent={handleEdit}
          onDeleteEvent={handleDelete}
          onAddTransactionContextual={(context) => {
            setOpenKpiDialog(null);
            setTimeout(() => setShowContextualDialog({ open: true, ...context }), 150);
          }}
        />

        {/* Dialog contextual para nova transação */}
        <TransactionDialog
          open={showContextualDialog.open}
          onOpenChange={(open) => setShowContextualDialog((prev) => ({ ...prev, open }))}
          type={showContextualDialog.type}
          expenseType={showContextualDialog.expenseType}
          onSubmit={showContextualDialog.type === 'income' ? handleAddIncome : handleAddExpense}
          loading={transactionsLoading}
        />

        {/* Floating Action Buttons */}
        <FloatingActionButtons
          onAddExpense={() => {
            if (userLoading || !user?.id) {
              toast.error('Aguarde, carregando usuário...');
              return;
            }
            setShowContextualDialog({ open: true, type: 'expense' });
          }}
          onAddIncome={() => {
            if (userLoading || !user?.id) {
              toast.error('Aguarde, carregando usuário...');
              return;
            }
            setShowContextualDialog({ open: true, type: 'income' });
          }}
        />
        {/* Faturas dos cartões de crédito */}
        {creditCards.length > 0 && (
          <div className="mt-8 space-y-8">
            <h3 className="font-semibold text-lg">Próximas Faturas de Cartão de Crédito</h3>
            {creditCards.map(card => (
              <CreditCardInvoices
                key={card.id}
                card={card}
                invoices={cardInvoices[card.id] || []}
                loading={!!invoicesLoading[card.id]}
                onSave={invoice => handleSaveInvoice(card.id, invoice)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}