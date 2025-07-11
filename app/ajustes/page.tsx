"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import WhatsAppInput from "@/components/WhatsAppInput";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User2, MessageCircle, Calendar, BarChart2, Bell, ArrowLeft, Upload, Trash2, Plus, Building2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBankAccountsRefactored, BankAccount, CreateBankAccountData, UpdateBankAccountData } from "@/hooks/useBankAccountsRefactored";
import { useCreditCardsRefactored } from "@/hooks/useCreditCardsRefactored";
import { AVAILABLE_BANKS, getBankName, getAccountTypeName, validateAccountData } from "@/lib/bankAccounts";
import { supabase } from "@/lib/supabaseClient";
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/supabaseClient';
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCardList } from '@/components/credit-cards/CreditCardList';
import { useCreditCards } from '@/hooks/useCreditCards';
import { CreditCardInvoices } from '@/components/credit-cards/CreditCardInvoices';
import { useTransactions } from '@/hooks/useTransactions';

const notificationTypes = [
  {
    key: "weekly_summary",
    label: "Resumo da Semana",
    icon: <BarChart2 className="w-4 h-4 mr-2 text-lime-600" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Semana finalizada! 🎉</div>
        <div>💰 <b>Economia:</b> R$ 340,00</div>
        <div>📊 <b>Gastos:</b> R$ 1.260,00</div>
        <div>🎯 <b>Para metas:</b> R$ 204,00</div>
        <div className="mt-2">Destaque: Você economizou 15% em transporte! Continue assim! 🚀</div>
      </div>
    ),
    defaultDay: "domingo",
    defaultHour: "18:00"
  },
  {
    key: "monthly_projection",
    label: "Projeção Mensal",
    icon: <Calendar className="w-4 h-4 mr-2 text-blue-600" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Projeção Mensal 📊</div>
        <div>Com base no seu padrão atual, você vai fechar julho com <b>R$ 1.890,50</b>.</div>
        <div className="mt-2">Para melhorar:</div>
        <ul className="list-disc ml-5">
          <li>Reduza 20% nos gastos com alimentação</li>
          <li>Mantenha o controle no transporte</li>
        </ul>
        <div className="mt-2">Potencial: <b>R$ 2.340,00</b> 💪</div>
      </div>
    ),
    defaultDay: "primeiro dia do mês",
    defaultHour: "09:00"
  },
  {
    key: "alerts",
    label: "Alertas de Gastos",
    icon: <Bell className="w-4 h-4 mr-2 text-red-500" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Atenção! 🚨</div>
        <div>Você ultrapassou o limite de gastos em <b>Alimentação</b> nesta semana.</div>
        <div className="mt-2">Dica: Reveja seus gastos e ajuste seu planejamento.</div>
      </div>
    ),
    defaultDay: "quando acontecer",
    defaultHour: "imediato"
  }
];

const diasSemana = [
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"
];
const horarios = [
  "08:00", "09:00", "12:00", "18:00", "20:00", "21:00"
];

// Defina o tipo para notificacoes
interface NotificacaoConfig {
  enabled: boolean;
  day: string;
  hour: string;
}

const notificationKeys = ["weekly_summary", "monthly_projection", "alerts"] as const;
type NotificationKey = typeof notificationKeys[number];

function formatDateFriendly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('pt-BR', { month: 'short' });
  const year = d.getFullYear();
  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  } else {
    return `${day} ${month} ${year}`;
  }
}

export default function AjustesPage() {
  // Perfil
  const [nome, setNome] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  // Notificações
  const [notificacoes, setNotificacoes] = useState<Record<NotificationKey, NotificacaoConfig>>({
    weekly_summary: { enabled: true, day: "domingo", hour: "18:00" },
    monthly_projection: { enabled: true, day: "primeiro dia do mês", hour: "09:00" },
    alerts: { enabled: true, day: "quando acontecer", hour: "imediato" }
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Estados para contas bancárias
  const [newAccount, setNewAccount] = useState<Partial<CreateBankAccountData & { balance_date?: string }>>({
    name: '',
    bank: '',
    account_type: 'checking',
    balance: 0,
    balance_date: new Date().toISOString().split('T')[0]
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Hook para contas bancárias
  const { accounts: bankAccounts, loading: accountsLoading, error: accountsError, addAccount, updateAccount, deleteAccount } = useBankAccountsRefactored();

  // Adicionar estado de carregamento do perfil
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Adicionar estado para userId
  const [userId, setUserId] = useState<string | null>(null);

  // Carregar perfil do usuário ao abrir a tela
  useEffect(() => {
    async function loadProfile() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) throw new Error('Usuário não autenticado');
        const userId = authData.user.id;
        setUserId(userId);
        let profile;
        try {
          profile = await getUserProfile(userId);
        } catch (err: any) {
          // Se não existe, cria
          profile = await createUserProfile(userId, authData.user.email || '', authData.user.user_metadata?.full_name || '');
        }
        setNome(profile.nome || '');
        setWhatsapp(profile.whatsapp || '');
        setAvatarUrl(profile.avatar_url || '');
        setNotificacoes({
          weekly_summary: { enabled: true, day: "domingo", hour: "18:00", ...(profile.notificacoes?.weekly_summary || {}) },
          monthly_projection: { enabled: true, day: "primeiro dia do mês", hour: "09:00", ...(profile.notificacoes?.monthly_projection || {}) },
          alerts: { enabled: true, day: "quando acontecer", hour: "imediato", ...(profile.notificacoes?.alerts || {}) }
        });
      } catch (err: any) {
        setProfileError(err.message || 'Erro ao carregar perfil');
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Hook dos cartões de crédito
  const {
    cards: creditCards,
    loading: creditCardsLoading,
    createCard,
    updateCard,
    deleteCard,
    getInvoices,
    upsertInvoice
  } = useCreditCardsRefactored();

  // Estado para faturas de cada cartão
  const [cardInvoices, setCardInvoices] = useState<Record<string, any[]>>({});
  const [invoicesLoading, setInvoicesLoading] = useState<Record<string, boolean>>({});

  // Função para buscar faturas de um cartão
  const fetchInvoices = async (cardId: string) => {
    setInvoicesLoading(prev => ({ ...prev, [cardId]: true }));
    try {
      const invoices = await (creditCards.length && userId ? await getInvoices(cardId) : []);
      setCardInvoices(prev => ({ ...prev, [cardId]: invoices }));
    } finally {
      setInvoicesLoading(prev => ({ ...prev, [cardId]: false }));
    }
  };

  // Buscar faturas ao carregar cartões
  useEffect(() => {
    if (!userId) return;
    creditCards.forEach(card => {
      if (!cardInvoices[card.id]) fetchInvoices(card.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditCards, userId]);

  // Função para salvar/editar fatura
  const handleSaveInvoice = async (cardId: string, invoice: { month: string; value: number }) => {
    setInvoicesLoading(prev => ({ ...prev, [cardId]: true }));
    try {
      await upsertInvoice({
        credit_card_id: cardId,
        month: invoice.month,
        value: invoice.value,
      });
      await fetchInvoices(cardId);
    } finally {
      setInvoicesLoading(prev => ({ ...prev, [cardId]: false }));
    }
  };

  // Salvar perfil
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error('Usuário não autenticado');
      const userId = authData.user.id;
      await updateUserProfile(userId, {
        nome,
        whatsapp,
        notificacoes
      });
      toast.success('Ajustes salvos com sucesso!');
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao salvar perfil');
      toast.error(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  function handleNotificationChange(key: NotificationKey, field: keyof NotificacaoConfig, value: any) {
    setNotificacoes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  }



  // Remover todos os estados relacionados a avatarFile, avatarPreview, avatarUrl, showCrop, crop, zoom, croppedAreaPixels
  // Remover as funções handleAvatarChange, handleCropSave, getCroppedImg, onCropComplete, handleRemoveAvatar
  // Remover importações de Cropper, Dialog, DialogContent, DialogHeader, DialogTitle, uploadUserAvatar
  // No JSX, remova o botão de upload/trocar/remover foto e o Dialog de crop
  // O Avatar deve ser:
  // <Avatar>
  //   <AvatarFallback>{nome ? nome[0].toUpperCase() : <User2 className="w-5 h-5" />}</AvatarFallback>
  // </Avatar>

  // Adicionar nova conta
  const handleAddAccount = async () => {
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
    setSavingAccount(true);
    try {
      await addAccount({
        name: newAccount.name!,
        bank: newAccount.bank!,
        account_type: newAccount.account_type as 'checking' | 'savings',
        balance: Number(newAccount.balance),
        balance_date: newAccount.balance_date || new Date().toISOString().split('T')[0]
      });
      setNewAccount({ name: '', bank: '', account_type: 'checking', balance: 0 });
      setShowAddAccount(false);
      toast.success('Conta adicionada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar conta');
    } finally {
      setSavingAccount(false);
    }
  };

  // Remover conta
  const handleRemoveAccount = async (id: string) => {
    setSavingAccount(true);
    try {
      await deleteAccount(id);
      toast.success('Conta removida com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover conta');
    } finally {
      setSavingAccount(false);
    }
  };

  // Editar conta
  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
  };

  // Salvar edição
  const handleSaveAccountEdit = async (updatedAccount: BankAccount) => {
    const errors = validateAccountData({
      name: updatedAccount.name,
      bank: updatedAccount.bank,
      account_type: updatedAccount.account_type,
      balance: Number(updatedAccount.balance)
    });
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setSavingAccount(true);
    try {
      await updateAccount(updatedAccount.id, {
        name: updatedAccount.name,
        bank: updatedAccount.bank,
        account_type: updatedAccount.account_type,
        balance: Number(updatedAccount.balance),
        balance_date: updatedAccount.balance_date
      });
      setEditingAccount(null);
      toast.success('Conta atualizada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar conta');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleCancelAccountEdit = () => {
    setEditingAccount(null);
  };

  // Adicionar hook para transações (assinaturas)
  const { transactions, loading: transactionsLoading } = useTransactions();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <User2 className="w-6 h-6 text-primary" /> Ajustes do Usuário
            </CardTitle>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Edite seu perfil e preferências de notificações do Julius.</p>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="space-y-8">
              {/* Skeleton para perfil */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              {/* Skeleton para notificações */}
              <div>
                <Skeleton className="h-6 w-40 mb-3" />
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
              {/* Skeleton para contas bancárias */}
              <div>
                <Skeleton className="h-6 w-40 mb-3" />
                <div className="space-y-3">
                  {[1,2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSave}>
              {/* Perfil */}
              <div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como prefere ser chamado?" />
                  </div>
                  <div>
                    <WhatsAppInput
                      value={whatsapp}
                      onChange={setWhatsapp}
                      placeholder="+55 24 98124-0000"
                    />
                  </div>
                </div>
              </div>
              {/* Notificações */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Notificações WhatsApp</h3>
                <div className="space-y-6">
                  {notificationTypes.map(nt => {
                    const key = nt.key as NotificationKey;
                    return (
                      <div key={nt.key} className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          {nt.icon}
                          <span className="font-medium">{nt.label}</span>
                          <Switch
                            checked={!!notificacoes[key]?.enabled}
                            onCheckedChange={v => handleNotificationChange(key, "enabled", v)}
                            className="ml-auto"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Label>Dia:</Label>
                            <Select
                              value={notificacoes[key]?.day}
                              onValueChange={v => handleNotificationChange(key, "day", v)}
                              disabled={!notificacoes[key]?.enabled}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Dia" />
                              </SelectTrigger>
                              <SelectContent>
                                {nt.key === "weekly_summary" && diasSemana.map(dia => (
                                  <SelectItem key={dia} value={dia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</SelectItem>
                                ))}
                                {nt.key === "monthly_projection" && (
                                  <SelectItem value="primeiro dia do mês">Primeiro dia do mês</SelectItem>
                                )}
                                {nt.key === "alerts" && (
                                  <SelectItem value="quando acontecer">Quando acontecer</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label>Horário:</Label>
                            <Select
                              value={notificacoes[key]?.hour}
                              onValueChange={v => handleNotificationChange(key, "hour", v)}
                              disabled={!notificacoes[key]?.enabled}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Horário" />
                              </SelectTrigger>
                              <SelectContent>
                                {nt.key === "weekly_summary" && horarios.map(h => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                                {nt.key === "monthly_projection" && horarios.map(h => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                                {nt.key === "alerts" && (
                                  <SelectItem value="imediato">Imediato</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Exemplo:</Label>
                          {nt.example}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contas Bancárias */}
              <div>
                <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Contas Bancárias
                </h3>
                <div className="space-y-4">
                  {/* Lista de contas existentes */}
                  {accountsLoading ? (
                    <div className="text-center py-8">
                      <p>Carregando contas bancárias...</p>
                    </div>
                  ) : accountsError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{accountsError}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bankAccounts.map(account => (
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
                                    <SelectTrigger className="w-40">
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
                                    <SelectTrigger className="w-40">
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
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <Label>Data do saldo</Label>
                                  <Input
                                    type="date"
                                    value={editingAccount.balance_date}
                                    onChange={e => setEditingAccount(prev => prev ? { ...prev, balance_date: e.target.value } : null)}
                                    max={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleSaveAccountEdit(editingAccount)} className="flex-1" disabled={savingAccount}>
                                  {savingAccount ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button variant="outline" onClick={handleCancelAccountEdit} disabled={savingAccount}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{account.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {getBankName(account.bank)} • 
                                  {getAccountTypeName(account.account_type)}
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
                              <div className="text-xs text-muted-foreground">
                                Saldo em: {formatDateFriendly(account.balance_date || '')}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAccount(account)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAccount(account.id)}
                                  className="text-red-500 hover:text-red-700"
                                  disabled={savingAccount}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Botão para adicionar nova conta */}
                      {!showAddAccount && (
                        <Button
                          onClick={() => setShowAddAccount(true)}
                          variant="outline"
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Nova Conta
                        </Button>
                      )}
                      {/* Formulário para adicionar nova conta */}
                      {showAddAccount && (
                        <div className="border rounded-lg p-4 space-y-4 mt-4">
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
                                <SelectTrigger className="w-40">
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
                                <SelectTrigger className="w-40">
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
                            <Button onClick={handleAddAccount} className="flex-1" disabled={savingAccount}>
                              <Plus className="w-4 h-4 mr-2" />
                              {savingAccount ? 'Salvando...' : 'Adicionar Conta'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowAddAccount(false)}
                              disabled={savingAccount}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Dica:</strong> Mantenha seus saldos atualizados para ter uma visão precisa 
                      do seu controle financeiro. Você pode ajustar os valores sempre que necessário.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cartões de Crédito */}
              <div>
                <CreditCardList
                  bankAccounts={bankAccounts}
                  cards={creditCards}
                  loading={creditCardsLoading}
                  onCreate={async (card) => {
                    await createCard(card);
                  }}
                  onUpdate={updateCard}
                  onDelete={deleteCard}
                />
                {/* Faturas de cada cartão */}
                <div className="mt-8 space-y-8">
                  {creditCards.map(card => (
                    <CreditCardInvoices
                      key={card.id}
                      card={card}
                      invoices={cardInvoices[card.id] || []}
                      loading={!!invoicesLoading[card.id]}
                      onSave={invoice => handleSaveInvoice(card.id, invoice)}
                      transactions={transactions} // Passa as transações para o componente
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="mt-2" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Ajustes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 