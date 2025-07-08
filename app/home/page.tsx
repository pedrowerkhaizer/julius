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

// Layout components
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButtons } from "@/components/layout/FloatingActionButtons";

// Dashboard components
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { Timeline } from "@/components/dashboard/Timeline";
import { PeriodFilterComponent } from "@/components/dashboard/PeriodFilter";

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
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openKpiDialog, setOpenKpiDialog] = useState<string | null>(null);
  
  // Edit/Delete states
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Estado para projeção
  const [projectionDate, setProjectionDate] = useState(new Date().toISOString().split('T')[0]);

  // Custom hooks for calculations
  const { kpis, dateRange, loading: kpisLoading } = useKPIs({
    transactions,
    bankAccounts,
    period,
    customStart,
    customEnd,
    loading: transactionsLoading
  });

  const { timelineEvents, groupedEvents, loading: timelineLoading } = useTimeline({
    transactions,
    dateRange,
    loading: transactionsLoading
  });

  // Calcular saldo projetado baseado na data selecionada
  const projectedBalance = (() => {
    const totalAccountBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Filtrar transações até a data de projeção
    const projectionDateObj = new Date(projectionDate);
    const projectedTransactions = transactions.filter(transaction => {
      if (transaction.is_recurring) {
        if (transaction.day) {
          const transactionDate = new Date(projectionDateObj.getFullYear(), projectionDateObj.getMonth(), transaction.day);
          return transactionDate <= projectionDateObj;
        }
        return false;
      } else {
        if (transaction.date) {
          const transactionDate = new Date(transaction.date);
          return transactionDate <= projectionDateObj;
        }
        return false;
      }
    });

    const projectedIncome = projectedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const projectedExpense = projectedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return totalAccountBalance + projectedIncome - projectedExpense;
  })();

  // Sincronizar projectionDate com o período selecionado
  useEffect(() => {
    let newProjectionDate = projectionDate;
    if (period === 'custom') {
      // customEnd já é string, mas garantir formato yyyy-mm-dd
      newProjectionDate = typeof customEnd === 'string' ? customEnd : (customEnd instanceof Date ? customEnd.toISOString().split('T')[0] : projectionDate);
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
    try {
      await addTransaction(data);
      setShowIncomeDialog(false);
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const handleAddExpense = async (data: any) => {
    try {
      await addTransaction(data);
      setShowExpenseDialog(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEdit = (event: any, occurrenceDate?: string) => {
    setEditingEvent({ ...event, occurrenceDate });
    setShowEditDialog(true);
  };

  const handleDelete = (event: any, occurrenceDate?: string) => {
    setEditingEvent({ ...event, occurrenceDate });
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = async (data: any, mode: 'single' | 'all') => {
    if (!editingEvent) return;

    try {
      if (mode === 'single' && editingEvent.occurrenceDate) {
        // Create recurrence exception
        await updateRecurrenceException(
          editingEvent.transactionIdOriginal,
          editingEvent.occurrenceDate,
          data
        );
      } else {
        // Update the entire transaction
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

    try {
      if (mode === 'single' && editingEvent.occurrenceDate) {
        // Create recurrence exception for deletion
        await deleteRecurrenceException(
          editingEvent.transactionIdOriginal,
          editingEvent.occurrenceDate
        );
      } else {
        // Delete the entire transaction
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
    try {
      await addAccount(data);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleUpdateAccount = async (id: string, data: any) => {
    try {
      await updateAccount(id, data);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

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
        <TransactionDialog
          open={showIncomeDialog}
          onOpenChange={setShowIncomeDialog}
          type="income"
          onSubmit={handleAddIncome}
          loading={transactionsLoading}
        />

        <TransactionDialog
          open={showExpenseDialog}
          onOpenChange={setShowExpenseDialog}
          type="expense"
          onSubmit={handleAddExpense}
          loading={transactionsLoading}
        />

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
        />

        {/* Floating Action Buttons */}
        <FloatingActionButtons
          onAddExpense={() => setShowExpenseDialog(true)}
          onAddIncome={() => setShowIncomeDialog(true)}
        />
      </div>
    </div>
  );
}