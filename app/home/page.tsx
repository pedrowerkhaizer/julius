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
import { useRecurrenceExceptions } from "@/hooks/useRecurrenceExceptions";
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

  // Exceções de recorrência
  const { exceptions: recurrenceExceptions, loading: recurrenceLoading, loadExceptions } = useRecurrenceExceptions();

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

  // Primeiro, calcula o dateRange com useKPIs (sem timelineEvents)
  const { dateRange } = useKPIs({
    transactions,
    bankAccounts,
    period,
    customStart,
    customEnd,
    loading: transactionsLoading,
    invoices: allInvoices
  });

  // Depois, gera os eventos da timeline já com o dateRange correto
  const { timelineEvents, groupedEvents, loading: timelineLoading } = useTimeline({
    transactions,
    dateRange,
    loading: transactionsLoading || recurrenceLoading,
    invoices: allInvoices, // NOVO
    creditCards, // NOVO
    recurrenceExceptions
  });

  // Por fim, calcula os KPIs finais usando os eventos da timeline
  const { kpis, loading: kpisLoading } = useKPIs({
    transactions,
    bankAccounts,
    period,
    customStart,
    customEnd,
    loading: transactionsLoading,
    invoices: allInvoices,
    timelineEvents // NOVO: KPIs batem com a timeline
  });

  // Soma das faturas do período selecionado
  const invoicesSum = (() => {
    if (!dateRange?.start || !dateRange?.end) return 0;
    let sum = 0;
    allInvoices.forEach(invoice => {
      // invoice.month formato 'YYYY-MM'
      const [year, month] = invoice.month.split('-').map(Number);
      // Considera o vencimento no dia do cartão (card.due_day)
      const card = creditCards.find(c => c.id === invoice.credit_card_id);
      const dueDay = card?.due_day || 1;
      const dueDate = new Date(year, month - 1, dueDay);
      if (dueDate >= dateRange.start && dueDate <= dateRange.end) {
        sum += invoice.value;
      }
    });
    return sum;
  })();

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
        // Recarrega exceções imediatamente após deletar
        await loadExceptions();
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

  const loading = userLoading || transactionsLoading || kpisLoading || timelineLoading;

  // Calcular detalhamento do saldo projetado
  const projectedDetails = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const projectionDateObj = new Date(projectionDate);
    projectionDateObj.setHours(23, 59, 59, 999);
    let saldoInicial = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    let entradas = 0;
    let fixas = 0;
    let variaveis = 0;
    let assinaturas = 0;
    let faturas = 0;
    transactions.forEach(transaction => {
      if (transaction.is_recurring && transaction.day) {
        let cursor = new Date(today);
        while (cursor <= projectionDateObj) {
          const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), transaction.day);
          if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
            if (transaction.type === 'income') entradas += transaction.amount;
            if (transaction.type === 'expense') {
              if (transaction.expense_type === 'fixed') fixas += transaction.amount;
              else if (transaction.expense_type === 'variable') variaveis += transaction.amount;
              else if (transaction.expense_type === 'subscription') assinaturas += transaction.amount;
            }
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      } else if (transaction.date) {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= today && transactionDate <= projectionDateObj) {
          if (transaction.type === 'income') entradas += transaction.amount;
          if (transaction.type === 'expense') {
            if (transaction.expense_type === 'fixed') fixas += transaction.amount;
            else if (transaction.expense_type === 'variable') variaveis += transaction.amount;
            else if (transaction.expense_type === 'subscription') assinaturas += transaction.amount;
          }
        }
      }
    });
    creditCards.forEach(card => {
      const invoices = cardInvoices[card.id] || [];
      invoices.forEach(invoice => {
        const [year, month] = invoice.month.split('-').map(Number);
        const dueDate = new Date(year, month - 1, card.due_day, 12);
        if (dueDate >= today && dueDate <= projectionDateObj) {
          faturas += invoice.value;
        }
      });
    });
    return { saldoInicial, entradas, fixas, variaveis, assinaturas, faturas };
  })();

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
          kpis={(() => {
            // Remove o KPI de assinaturas e insere o de faturas na mesma posição
            const kpisWithoutSubscription = kpis.filter(kpi => kpi.key !== 'subscription');
            const subscriptionIndex = kpis.findIndex(kpi => kpi.key === 'subscription');
            const invoicesKPI = {
              key: 'invoices_sum',
              title: 'Faturas do Período',
              value: invoicesSum,
              color: 'blue' as const,
              icon: 'CreditCard',
              subtitle: invoicesSum === 0 ? 'Nenhuma fatura no período' : '',
              count: 0
            };
            if (subscriptionIndex >= 0) {
              kpisWithoutSubscription.splice(subscriptionIndex, 0, invoicesKPI);
              return kpisWithoutSubscription;
            }
            // Se não achar, adiciona no final
            return [...kpisWithoutSubscription, invoicesKPI];
          })()}
          onKPIClick={setOpenKpiDialog}
          loading={loading}
          projectedBalance={projectedBalance}
          projectedSubtitle={`Até ${new Date(projectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}.`}
        />

        {/* Timeline */}
        <Timeline
          events={timelineEvents}
          groupedEvents={groupedEvents}
          creditCards={creditCards}
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
          creditCards={creditCards}
          invoicesPeriod={(() => {
            if (!dateRange?.start || !dateRange?.end) return [];
            return allInvoices
              .filter(inv => {
                const [year, month] = inv.month.split('-').map(Number);
                const card = creditCards.find(c => c.id === inv.credit_card_id);
                const dueDay = card?.due_day || 1;
                const dueDate = new Date(year, month - 1, dueDay);
                return dueDate >= dateRange.start && dueDate <= dateRange.end;
              })
              .map(inv => {
                const card = creditCards.find(c => c.id === inv.credit_card_id);
                return {
                  ...inv,
                  credit_card_name: card?.name || inv.credit_card_id
                };
              });
          })()}
          transactions={transactions}
          bankAccounts={bankAccounts}
          onAddAccount={handleAddAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
          projectedBalance={projectedBalance}
          projectedDetails={projectedDetails}
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
        {creditCards.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Próximas Faturas de Cartão de Crédito</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Mês de Vencimento</th>
                    <th className="px-4 py-2 text-left">Banco</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Agrupar por mês de vencimento */}
                  {(() => {
                    // Monta um mapa: { 'YYYY-MM': [ { card, invoice, dueDate } ] }
                    const grouped: Record<string, Array<{ card: any, invoice: any, dueDate: Date }>> = {};
                    creditCards.forEach(card => {
                      (cardInvoices[card.id] || []).forEach(invoice => {
                        const [year, month] = invoice.month.split('-').map(Number);
                        const dueDate = new Date(year, month - 1, card.due_day);
                        const key = `${year}-${String(month).padStart(2, '0')}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push({ card, invoice, dueDate });
                      });
                    });
                    // Ordena os meses
                    const sortedMonths = Object.keys(grouped).sort();
                    return sortedMonths.flatMap(monthKey => {
                      const rows = grouped[monthKey]
                        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
                      const subtotal = rows.reduce((sum, r) => sum + r.invoice.value, 0);
                      return [
                        <tr key={monthKey + '-header'}>
                          <td colSpan={3} className="px-4 py-2 font-semibold bg-muted">{new Date(monthKey + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                        </tr>,
                        ...rows.map((r, idx) => (
                          <tr key={r.card.id + r.invoice.month} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted'}>
                            <td className="px-4 py-2">{r.dueDate.toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-2">{r.card.name}</td>
                            <td className="px-4 py-2 text-right font-semibold">{r.invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          </tr>
                        )),
                        <tr key={monthKey + '-subtotal'}>
                          <td colSpan={2} className="px-4 py-2 text-right font-semibold">Subtotal do mês:</td>
                          <td className="px-4 py-2 text-right font-bold">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                      ];
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}