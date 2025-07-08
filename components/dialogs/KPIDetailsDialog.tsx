import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimelineEvent } from '@/hooks/useTimeline';
import { BankAccount, CreateAccountData } from '@/lib/types/finance';
import { AVAILABLE_BANKS, getBankName, getAccountTypeName, validateAccountData } from '@/lib/bankAccounts';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, Building2, TrendingUp, TrendingDown } from 'lucide-react';

export interface KPIDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiKey: string | null;
  events: TimelineEvent[];
  creditCards: Array<{ id: string; name: string }>;
  // Novas props para os diferentes tipos de KPI
  bankAccounts?: BankAccount[];
  onAddAccount?: (data: CreateAccountData) => Promise<void>;
  onUpdateAccount?: (id: string, data: Partial<BankAccount>) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  projectedBalance?: number;
  onProjectionDateChange?: (date: string) => void;
  projectionDate?: string;
  // Novas props para edição/deleção de eventos
  onEditEvent?: (event: TimelineEvent, occurrenceDate?: string) => void;
  onDeleteEvent?: (event: TimelineEvent, occurrenceDate?: string) => void;
}

// Função utilitária para formatar data amigável
function formatFriendly(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function KPIDetailsDialog({ 
  open, 
  onOpenChange, 
  kpiKey, 
  events, 
  creditCards,
  bankAccounts = [],
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  projectedBalance = 0,
  onProjectionDateChange,
  projectionDate,
  onEditEvent,
  onDeleteEvent
}: KPIDetailsDialogProps) {
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<CreateAccountData & { balance_date?: string }>>({
    name: '',
    bank: '',
    account_type: 'checking',
    balance: 0,
    balance_date: new Date().toISOString().split('T')[0]
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!kpiKey) return null;

  const getTitle = () => {
    const titles = {
      income: 'Detalhes das Entradas',
      expense: 'Detalhes das Saídas',
      fixed: 'Detalhes das Despesas Fixas',
      variable: 'Detalhes das Despesas Variáveis',
      subscription: 'Detalhes das Assinaturas',
      performance: 'Detalhes da Performance do Mês',
      balance: 'Detalhes do Saldo das Contas',
      projected: 'Detalhes do Saldo Projetado'
    };
    return titles[kpiKey as keyof typeof titles] || 'Detalhes';
  };

  const getDescription = () => {
    const descriptions = {
      income: 'Soma de todas as entradas do período.',
      expense: 'Soma de todas as saídas do período (fixas, variáveis e assinaturas).',
      fixed: 'Soma de todas as despesas fixas do período.',
      variable: 'Soma de todas as despesas variáveis do período.',
      subscription: 'Soma de todas as assinaturas do período.',
      performance: 'Saldo do período (entradas - saídas).',
      balance: 'Saldo atual das contas bancárias.',
      projected: 'Saldo projetado considerando entradas e saídas futuras.'
    };
    return descriptions[kpiKey as keyof typeof descriptions] || '';
  };

  const getFilteredEvents = () => {
    switch (kpiKey) {
      case 'income':
        return events.filter(e => e.type === 'income');
      case 'expense':
        return events.filter(e => e.type === 'expense');
      case 'fixed':
        return events.filter(e => e.type === 'expense' && e.expenseType === 'fixed');
      case 'variable':
        return events.filter(e => e.type === 'expense' && e.expenseType === 'variable');
      case 'subscription':
        return events.filter(e => e.type === 'expense' && e.expenseType === 'subscription');
      case 'performance':
        // Para performance, retornamos todas as transações do período
        return events;
      default:
        return [];
    }
  };

  const filteredEvents = getFilteredEvents();

  // Calcular totais para performance
  const performanceTotals = kpiKey === 'performance' ? {
    income: filteredEvents.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
    expense: filteredEvents.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
    total: filteredEvents.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0) - 
           filteredEvents.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  } : null;

  // Handlers para contas bancárias
  const handleAddAccount = async () => {
    if (!onAddAccount) return;
    
    const errors = validateAccountData({
      name: newAccount.name || '',
      bank: newAccount.bank || '',
      account_type: (newAccount.account_type as 'checking' | 'savings') || 'checking',
      balance: Number(newAccount.balance) || 0
    });
    
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSaving(true);
    try {
      await onAddAccount({
        name: newAccount.name!,
        bank: newAccount.bank!,
        account_type: newAccount.account_type as 'checking' | 'savings',
        balance: Number(newAccount.balance),
        balance_date: newAccount.balance_date || new Date().toISOString().split('T')[0]
      });
      setNewAccount({ name: '', bank: '', account_type: 'checking', balance: 0 });
      setShowAddAccount(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar conta');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountEdit = async () => {
    if (!editingAccount || !onUpdateAccount) return;
    
    setSaving(true);
    try {
      await onUpdateAccount(editingAccount.id, {
        name: editingAccount.name,
        bank: editingAccount.bank,
        account_type: editingAccount.account_type,
        balance: editingAccount.balance,
        balance_date: editingAccount.balance_date
      });
      setEditingAccount(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar conta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!onDeleteAccount) return;
    
    setSaving(true);
    try {
      await onDeleteAccount(id);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover conta');
    } finally {
      setSaving(false);
    }
  };

  const renderPerformanceDetails = () => (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Entradas</div>
          <div className="text-lg font-semibold text-green-600">
            R$ {performanceTotals?.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Saídas</div>
          <div className="text-lg font-semibold text-red-600">
            R$ {performanceTotals?.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Saldo</div>
          <div className={`text-lg font-semibold ${performanceTotals?.total && performanceTotals.total > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            R$ {performanceTotals?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="space-y-3">
        <h4 className="font-medium">Entradas:</h4>
        {filteredEvents.filter(e => e.type === 'income').length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma entrada no período</p>
        ) : (
          filteredEvents.filter(e => e.type === 'income').map(event => (
            <div key={event.id} className="flex items-center gap-2 p-2 text-muted-foreground rounded-lg">
              <span className="text-xs text-muted-foreground w-20">{formatFriendly(event.dateStr)}</span>
              <span className="font-medium flex-1">{event.description}</span>
              <span className="text-green-600 font-semibold">
                R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => onEditEvent && onEditEvent(event, event.dateStr)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteEvent && onDeleteEvent(event, event.dateStr)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}

        <h4 className="font-medium">Saídas:</h4>
        {filteredEvents.filter(e => e.type === 'expense').length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma saída no período</p>
        ) : (
          filteredEvents.filter(e => e.type === 'expense').map(event => (
            <div key={event.id} className="flex items-center gap-2 p-2 text-muted-foreground rounded-lg">
              <span className="text-xs text-muted-foreground w-20">{formatFriendly(event.dateStr)}</span>
              <span className="font-medium flex-1">{event.description}</span>
              {event.expenseType && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({event.expenseType === "fixed" ? "Fixa" : event.expenseType === "variable" ? "Variável" : "Assinatura"})
                </span>
              )}
              <span className="text-red-600 font-semibold">
                R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => onEditEvent && onEditEvent(event, event.dateStr)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteEvent && onDeleteEvent(event, event.dateStr)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBalanceDetails = () => (
    <div className="space-y-4">
      {/* Lista de contas */}
      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma conta bancária configurada
          </p>
        ) : (
          bankAccounts.map(account => (
            <div key={account.id} className="border rounded-lg p-4">
              {editingAccount?.id === account.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Nome da conta</Label>
                      <Input
                        value={editingAccount.name}
                        onChange={e => setEditingAccount(prev => prev ? {...prev, name: e.target.value} : null)}
                      />
                    </div>
                    <div>
                      <Label>Banco</Label>
                      <Select 
                        value={editingAccount.bank} 
                        onValueChange={(value) => setEditingAccount(prev => prev ? {...prev, bank: value} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_BANKS.map(bank => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Tipo de conta</Label>
                      <Select 
                        value={editingAccount.account_type} 
                        onValueChange={(value) => setEditingAccount(prev => prev ? {...prev, account_type: value as 'checking' | 'savings'} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Conta Corrente</SelectItem>
                          <SelectItem value="savings">Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Saldo atual (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingAccount.balance}
                        onChange={e => setEditingAccount(prev => prev ? {...prev, balance: Number(e.target.value)} : null)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAccountEdit} className="flex-1" disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingAccount(null)} disabled={saving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getBankName(account.bank)} • {getAccountTypeName(account.account_type)}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <div className="font-semibold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(account.balance)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAccount(account)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Adicionar nova conta */}
      {!showAddAccount ? (
        <Button
          onClick={() => setShowAddAccount(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Conta
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Nova conta:</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome da conta</Label>
              <Input
                value={newAccount.name}
                onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Conta Principal"
              />
            </div>
            <div>
              <Label>Banco</Label>
              <Select 
                value={newAccount.bank} 
                onValueChange={(value) => setNewAccount(prev => ({ ...prev, bank: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_BANKS.map(bank => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo de conta</Label>
              <Select 
                value={newAccount.account_type} 
                onValueChange={(value) => setNewAccount(prev => ({ ...prev, account_type: value as 'checking' | 'savings' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Saldo atual (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newAccount.balance}
                onChange={e => setNewAccount(prev => ({ ...prev, balance: Number(e.target.value) }))}
                placeholder="0,00"
              />
            </div>
          </div>
          <div>
            <Label>Data do saldo</Label>
            <Input
              type="date"
              value={newAccount.balance_date}
              onChange={e => setNewAccount(prev => ({ ...prev, balance_date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddAccount} className="flex-1" disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Adicionar Conta'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAddAccount(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjectedDetails = () => (
    <div className="space-y-4">
      {/* Seletor de data */}
      <div>
        <Label htmlFor="projectionDate">Data de projeção</Label>
        <Input
          id="projectionDate"
          type="date"
          value={projectionDate}
          onChange={e => onProjectionDateChange?.(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Saldo projetado */}
      <div className="p-4 bg-muted border font-medium rounded-lg">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Saldo Projetado</div>
          <div className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(projectedBalance)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {projectionDate && `Para ${new Date(projectionDate).toLocaleDateString('pt-BR')}`}
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 O saldo projetado considera todas as entradas e saídas previstas até a data selecionada, 
          incluindo transações recorrentes e eventuais.
        </p>
      </div>
    </div>
  );

  const renderStandardDetails = () => (
    <ul className="space-y-1">
      {filteredEvents.length === 0 ? (
        <li className="text-muted-foreground">
          Nenhuma transação encontrada
        </li>
      ) : (
        filteredEvents.map(event => (
          <li key={event.id} className="flex justify-between items-center">
            <span className="font-medium">{event.description}</span>
            <div className="flex items-center gap-2">
              <span>
                R$ {event.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              {event.type === 'expense' && event.expenseType && (
                <span className="text-xs text-muted-foreground">
                  ({event.expenseType === "fixed" ? "Fixa" : event.expenseType === "variable" ? "Variável" : "Assinatura"})
                </span>
              )}
              {event.type === 'expense' && event.expenseType === 'subscription' && event.subscriptionCard && (
                <span className="text-xs text-muted-foreground">
                  ({creditCards.find(c => c.id === event.subscriptionCard)?.name || "Cartão"})
                </span>
              )}
            </div>
          </li>
        ))
      )}
    </ul>
  );

  const renderContent = () => {
    switch (kpiKey) {
      case 'performance':
        return renderPerformanceDetails();
      case 'balance':
        return renderBalanceDetails();
      case 'projected':
        return renderProjectedDetails();
      default:
        return renderStandardDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {kpiKey === 'performance' && <TrendingUp className="w-5 h-5 text-green-600" />}
            {kpiKey === 'balance' && <Building2 className="w-5 h-5 text-blue-600" />}
            {kpiKey === 'projected' && <TrendingUp className="w-5 h-5 text-purple-600" />}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 text-sm text-muted-foreground">
          {getDescription()}
        </div>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
} 