"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// Hooks refatorados
import { useKPIsRefactored } from "@/hooks/useKPIsRefactored";
import { useTransactionsRefactored } from "@/hooks/useTransactionsRefactored";
import { useBalanceRefactored } from "@/hooks/useBalanceRefactored";
import { useSimulationRefactored } from "@/hooks/useSimulationRefactored";

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

// Types
interface UserProfile {
  user_id: string;
  nome: string;
  whatsapp: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  account_type: string;
  balance: number;
  balance_date: string;
}

interface CreditCard {
  id: string;
  name: string;
  due_day: number;
}

interface TimelineEvent {
  id: string;
  date: string;
  events: any[];
}

export default function HomeRefactoredPage() {
  const router = useRouter();
  
  // Estados locais
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

  // Hooks refatorados
  const { kpis, loading: kpisLoading, error: kpisError, dateRange } = useKPIsRefactored({
    period,
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined,
  });

  const { 
    transactions, 
    loading: transactionsLoading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useTransactionsRefactored();

  const { 
    currentBalance, 
    projectedBalance, 
    details: balanceDetails, 
    loading: balanceLoading 
  } = useBalanceRefactored(projectionDate);

  const { simulationData, simulating, simulatePurchase } = useSimulationRefactored();

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
      await addTransaction({ ...data, type: 'income' });
      setShowContextualDialog({ open: false, type: 'income' });
      toast.success('Receita adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Erro ao adicionar receita');
    }
  };

  const handleAddExpense = async (data: any) => {
    try {
      await addTransaction({ ...data, type: 'expense' });
      setShowContextualDialog({ open: false, type: 'expense' });
      toast.success('Despesa adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erro ao adicionar despesa');
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
      await updateTransaction(editingEvent.transactionIdOriginal, data);
      setShowEditDialog(false);
      setEditingEvent(null);
      toast.success('Transação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleConfirmDelete = async (mode: 'single' | 'all') => {
    if (!editingEvent) return;
    try {
      await deleteTransaction(editingEvent.transactionIdOriginal);
      setShowDeleteDialog(false);
      setEditingEvent(null);
      toast.success('Transação removida com sucesso!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao remover transação');
    }
  };

  const handleLogout = () => {
    // This will be handled by the PageHeader component
  };

  const loading = kpisLoading || transactionsLoading || balanceLoading;

  // Mock data para componentes que ainda não foram refatorados
  const mockUser: UserProfile = { 
    user_id: 'user-id', 
    nome: 'Usuário',
    whatsapp: '+5511999999999',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const mockBankAccounts: BankAccount[] = [];
  const mockCreditCards: CreditCard[] = [];
  const mockTimelineEvents: TimelineEvent[] = [];
  const mockGroupedEvents: { date: string; events: TimelineEvent[] }[] = [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        user={mockUser} 
        userLoading={false} 
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

        {/* Timeline - ainda usando dados mock por enquanto */}
        <Timeline
          events={mockTimelineEvents}
          groupedEvents={mockGroupedEvents}
          creditCards={mockCreditCards}
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
          events={mockTimelineEvents}
          creditCards={mockCreditCards}
          invoicesPeriod={[]}
          transactions={transactions}
          bankAccounts={mockBankAccounts}
          onAddAccount={() => {}}
          onUpdateAccount={() => {}}
          onDeleteAccount={() => {}}
          projectedBalance={projectedBalance}
          projectedDetails={balanceDetails}
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
            setShowContextualDialog({ open: true, type: 'expense' });
          }}
          onAddIncome={() => {
            setShowContextualDialog({ open: true, type: 'income' });
          }}
        />

        {/* Exibir erros se houver */}
        {kpisError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Erro ao carregar KPIs: {kpisError}</p>
          </div>
        )}
      </div>
    </div>
  );
} 