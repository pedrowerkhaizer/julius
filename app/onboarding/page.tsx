"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  Building2,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createBankAccount,
  deleteBankAccount,
  getUserBankAccounts,
  validateAccountData,
  AVAILABLE_BANKS,
  getBankName,
  getAccountTypeName,
  BankAccount,
  CreateAccountData
} from '@/lib/bankAccounts';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/lib/supabaseClient';
import TransactionForm from '@/components/TransactionForm';
import WhatsAppInput from '@/components/WhatsAppInput';

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

const STEPS = [
  { id: 1, title: 'Seu Perfil', description: 'Informe seu nome e WhatsApp' },
  { id: 2, title: 'Receitas Recorrentes', description: 'Cadastre suas receitas fixas (ex: salário, pensão, etc)' },
  { id: 3, title: 'Despesas Recorrentes', description: 'Cadastre suas despesas fixas (ex: aluguel, energia, etc)' },
  { id: 4, title: 'Contas Bancárias', description: 'Configure suas contas e saldos atuais' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Estados para contas bancárias
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<CreateAccountData & { balance_date?: string }>>({
    name: '',
    bank: '',
    account_type: 'checking',
    balance: 0,
    balance_date: new Date().toISOString().split('T')[0]
  });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  // Estados para nome, whatsapp, receitas, despesas
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);

  // Carregar perfil ao abrir onboarding
  useEffect(() => {
    async function loadProfile() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) throw new Error('Usuário não autenticado');
        const userId = authData.user.id;
        let profile;
        try {
          profile = await getUserProfile(userId);
        } catch (err: any) {
          // Se não existe, cria
          profile = await createUserProfile(userId, authData.user.email || '', '');
        }
        setNome(profile.nome || '');
        setWhatsapp(profile.whatsapp || '');
      } catch (err: any) {
        setProfileError(err.message || 'Erro ao carregar perfil');
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Carregar contas do Supabase ao abrir o passo 4
  useEffect(() => {
    const loadAccounts = async () => {
      if (currentStep === 4) {
        setAccountsLoading(true);
        setAccountsError(null);
        try {
          const accounts = await getUserBankAccounts();
          setBankAccounts(accounts);
        } catch (err: any) {
          setAccountsError(err.message || 'Erro ao carregar contas bancárias');
        } finally {
          setAccountsLoading(false);
        }
      }
    };
    loadAccounts();
  }, [currentStep]);

  const handleNext = () => {
    // Validação antes de avançar
    if (currentStep === 1) {
      if (!nome.trim() || !whatsapp.trim()) {
        toast.error('Preencha nome e WhatsApp');
        return;
      }
    } else if (currentStep === 2) {
      if (incomes.length === 0) {
        toast.error('Cadastre pelo menos uma receita');
        return;
      }
    } else if (currentStep === 3) {
      if (expenses.length === 0) {
        toast.error('Cadastre pelo menos uma despesa');
        return;
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Adicionar nova conta (Supabase)
  const handleAddAccount = async (addAnother = false) => {
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
      const created = await createBankAccount({
        name: newAccount.name!,
        bank: newAccount.bank!,
        account_type: newAccount.account_type as 'checking' | 'savings',
        balance: Number(newAccount.balance),
        balance_date: newAccount.balance_date || new Date().toISOString().split('T')[0]
      });
      setBankAccounts(prev => [...prev, created]);
      setNewAccount({ name: '', bank: '', account_type: 'checking', balance: 0 });
      toast.success('Conta adicionada com sucesso!');
      if (!addAnother) setShowAddAccount(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar conta');
    } finally {
      setSavingAccount(false);
    }
  };

  // Remover conta (Supabase)
  const handleRemoveAccount = async (id: string) => {
    setSavingAccount(true);
    try {
      await deleteBankAccount(id);
      setBankAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Conta removida com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover conta');
    } finally {
      setSavingAccount(false);
    }
  };

  // handleFinish: salvar nome, whatsapp, receitas, despesas, contas e marcar onboarding_completed = true
  const handleFinish = async () => {
    if (!nome.trim() || !whatsapp.trim()) {
      toast.error('Preencha nome e WhatsApp');
      setCurrentStep(1);
      return;
    }
    if (incomes.length === 0) {
      toast.error('Cadastre pelo menos uma receita');
      setCurrentStep(2);
      return;
    }
    if (expenses.length === 0) {
      toast.error('Cadastre pelo menos uma despesa');
      setCurrentStep(3);
      return;
    }
    if (bankAccounts.length === 0) {
      toast.error('Adicione pelo menos uma conta bancária');
      setCurrentStep(4);
      return;
    }
    
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error('Usuário não autenticado');
      const userId = authData.user.id;
      
      // Salvar perfil com onboarding_completed = true
      await updateUserProfile(userId, { 
        nome, 
        whatsapp, 
        onboarding_completed: true 
      });
      
      // Salvar receitas
      for (const inc of incomes) {
        await supabase.from('transactions').insert({
          user_id: userId,
          description: inc.description,
          amount: inc.amount,
          is_recurring: inc.isRecurring,
          type: 'income',
          day: inc.isRecurring ? inc.day : null,
          date: !inc.isRecurring ? inc.date : null,
          recurrence_end_date: inc.recurrenceEndDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      // Salvar despesas
      for (const exp of expenses) {
        await supabase.from('transactions').insert({
          user_id: userId,
          description: exp.description,
          amount: exp.amount,
          is_recurring: exp.isRecurring,
          type: 'expense',
          expense_type: exp.expenseType,
          day: exp.isRecurring ? exp.day : null,
          date: !exp.isRecurring ? exp.date : null,
          recurrence_end_date: exp.recurrenceEndDate || null,
          subscription_card: exp.subscriptionCard || null,
          subscription_billing_day: exp.subscriptionBillingDay || null,
          subscription_card_due_day: exp.subscriptionCardDueDay || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      toast.success('Onboarding concluído!');
      router.push('/home');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar onboarding');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 sm:pt-0">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-8">
            <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-4" />
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Skeleton className="h-2 w-full mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Julius</h1>
          </div>
          <p className="text-muted-foreground">
            Vamos configurar seu assistente financeiro em 4 passos simples
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Passo {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <Info className="w-5 h-5 text-indigo-500" />}
              {currentStep === 2 && <Calendar className="w-5 h-5 text-indigo-500" />}
              {currentStep === 3 && <Building2 className="w-5 h-5 text-indigo-500" />}
              {currentStep === 4 && <Building2 className="w-5 h-5 text-indigo-500" />}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <p className="text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </CardHeader>
          <CardContent>
            {/* Step 1: Seu Perfil */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {profileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input 
                        id="nome" 
                        value={nome} 
                        onChange={e => setNome(e.target.value)} 
                        placeholder="Como prefere ser chamado?" 
                      />
                    </div>
                    <div>
                      <WhatsAppInput
                        value={whatsapp}
                        onChange={setWhatsapp}
                        placeholder="+55 24 98124-0000"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Receitas Recorrentes */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <TransactionForm
                  type="income"
                  transactions={incomes}
                  onTransactionsChange={setIncomes}
                />
              </div>
            )}

            {/* Step 3: Despesas Recorrentes */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <TransactionForm
                  type="expense"
                  transactions={expenses}
                  onTransactionsChange={setExpenses}
                />
              </div>
            )}

            {/* Step 4: Contas Bancárias */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <Building2 className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">
                    Configure suas contas bancárias
                  </h3>
                  <p className="text-muted-foreground">
                    Adicione suas contas correntes e poupanças com os saldos atuais
                  </p>
                </div>

                {/* Lista de contas existentes */}
                {accountsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : accountsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>{accountsError}</p>
                    <Button onClick={() => setAccountsError(null)} className="mt-4">
                      Tentar novamente
                    </Button>
                  </div>
                ) : bankAccounts.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">Suas contas:</h4>
                    {bankAccounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {getBankName(account.bank)} • 
                            {getAccountTypeName(account.account_type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Saldo em: {formatDateFriendly(account.balance_date || '')}
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>Você ainda não adicionou nenhuma conta bancária.</p>
                    <Button 
                      onClick={() => setShowAddAccount(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Nova Conta
                    </Button>
                  </div>
                )}

                {/* Formulário para adicionar nova conta */}
                {showAddAccount ? (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Nova conta:</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="accountName">Nome da conta</Label>
                        <Input
                          id="accountName"
                          value={newAccount.name}
                          onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Conta Principal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountBank">Banco</Label>
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
                        <Label htmlFor="accountType">Tipo de conta</Label>
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
                        <Label htmlFor="accountBalance">Saldo atual (R$)</Label>
                        <Input
                          id="accountBalance"
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
                      <Button onClick={() => handleAddAccount(false)} className="flex-1" disabled={savingAccount}>
                        <Plus className="w-4 h-4 mr-2" />
                        {savingAccount ? 'Salvando...' : 'Adicionar Conta'}
                      </Button>
                      <Button onClick={() => handleAddAccount(true)} variant="secondary" disabled={savingAccount}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar outra
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
                ) : (
                  <Button 
                    onClick={() => setShowAddAccount(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Nova Conta
                  </Button>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    💡 Por que precisamos do saldo atual?
                  </h4>
                  <p className="text-sm text-blue-700">
                    O saldo atual é fundamental para calcular seus limites diários 
                    e projetar quando você pode fazer gastos. Sem essa informação, 
                    não conseguimos te dar uma visão precisa do seu controle financeiro.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validação e alertas */}
        {currentStep === 1 && (!nome.trim() || !whatsapp.trim()) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Preencha nome e WhatsApp para continuar</span>
          </div>
        )}
        {currentStep === 2 && incomes.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Cadastre pelo menos uma receita para continuar</span>
          </div>
        )}
        {currentStep === 3 && expenses.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Cadastre pelo menos uma despesa para continuar</span>
          </div>
        )}
        {currentStep === 4 && bankAccounts.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Adicione pelo menos uma conta bancária para continuar</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              className="bg-lime-500 hover:bg-lime-600"
              disabled={!nome.trim() || !whatsapp.trim() || incomes.length === 0 || expenses.length === 0 || bankAccounts.length === 0 || loading}
            >
              {loading ? "Finalizando..." : "Finalizar Configuração"}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}