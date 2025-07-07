"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  ArrowLeft, 
  Wallet, 
  CreditCard, 
  Calendar, 
  Shield,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  Building2
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

const STEPS = [
  {
    id: 1,
    title: 'Conceito Básico',
    description: 'Entenda como funciona o controle de limites'
  },
  {
    id: 2,
    title: 'Configuração Inicial',
    description: 'Defina seus dias de pagamento e vencimento'
  },
  {
    id: 3,
    title: 'Contas Bancárias',
    description: 'Configure suas contas e saldos atuais'
  },
  {
    id: 4,
    title: 'Conexão Bancária',
    description: 'Conecte seus bancos via Open Finance'
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    paymentDay: '',
    cardDueDay: '',
    consentGiven: false
  });

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

  // Carregar contas do Supabase ao abrir o passo 3
  useEffect(() => {
    if (currentStep === 3) {
      async function loadAccounts() {
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
      loadAccounts();
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePluggyConnect = () => {
    // Simulate Pluggy connection
    toast.info('Abrindo conexão segura com seu banco...');
    
    setTimeout(() => {
      setFormData(prev => ({ ...prev, consentGiven: true }));
      toast.success('Conexão estabelecida com sucesso!');
    }, 2000);
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

  // Finalizar onboarding: apenas salva config inicial (dias) e navega
  const handleFinish = () => {
    if (!formData.paymentDay || !formData.cardDueDay) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (bankAccounts.length === 0) {
      toast.error('Adicione pelo menos uma conta bancária');
      return;
    }
    // Aqui pode chamar saveOnboardingConfig se desejar salvar dias no Supabase
    toast.success('Configuração inicial concluída!');
    router.push('/home');
  };

  const progress = (currentStep / STEPS.length) * 100;

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
            Vamos configurar seu assistente financeiro em 3 passos simples
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
              {currentStep === 4 && <Shield className="w-5 h-5 text-indigo-500" />}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <p className="text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </CardHeader>
          <CardContent>
            {/* Step 1: Concept Explanation */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="w-5 h-5 text-lime-500" />
                      <h3 className="font-semibold">Limite Diário</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Para débito/PIX, calculamos quanto você pode gastar por dia 
                      com base no seu limite mensal e dias úteis restantes.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-semibold">Cartão de Crédito</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Para o cartão, acumulamos os gastos durante o mês e 
                      debitamos o valor total apenas no vencimento.
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-lime-50 border border-lime-200 rounded-lg">
                  <h4 className="font-semibold text-lime-800 mb-2">
                    Por que isso é útil?
                  </h4>
                  <ul className="text-sm text-lime-700 space-y-1">
                    <li>• Evita que você gaste todo o limite no início do mês</li>
                    <li>• Ajuda a distribuir os gastos de forma equilibrada</li>
                    <li>• Mostra exatamente quanto você pode gastar hoje</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Initial Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDay">Dia do seu pagamento</Label>
                    <Select 
                      value={formData.paymentDay} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentDay: value }))}
                    >
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
                    <p className="text-xs text-muted-foreground">
                      Quando você recebe seu salário
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardDueDay">Vencimento do cartão</Label>
                    <Select 
                      value={formData.cardDueDay} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cardDueDay: value }))}
                    >
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
                    <p className="text-xs text-muted-foreground">
                      Quando vence sua fatura
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-2">
                    💡 Dica importante
                  </h4>
                  <p className="text-sm text-indigo-700">
                    Esses dias são fundamentais para calcular seus limites diários 
                    e projetar quando o dinheiro vai entrar e sair da sua conta.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Bank Accounts Configuration */}
            {currentStep === 3 && (
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
                  <div className="text-center py-8">
                    <p>Carregando suas contas bancárias...</p>
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

            {/* Step 4: Bank Connection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Conecte seus bancos com segurança
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Usamos o Open Finance para conectar suas contas de forma 
                    segura e sincronizar suas transações automaticamente.
                  </p>
                  
                  {!formData.consentGiven ? (
                    <Button 
                      onClick={handlePluggyConnect}
                      className="bg-lime-500 hover:bg-lime-600"
                      size="lg"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Conectar com Open Finance
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-lime-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Conexão estabelecida!</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🔒 Segurança</h4>
                    <p className="text-sm text-muted-foreground">
                      Suas credenciais não passam por nossos servidores. 
                      Tudo é criptografado e regulamentado pelo Banco Central.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🔄 Sincronização</h4>
                    <p className="text-sm text-muted-foreground">
                      Suas transações são sincronizadas automaticamente, 
                      mantendo seus limites sempre atualizados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              disabled={!formData.paymentDay || !formData.cardDueDay}
            >
              Finalizar Configuração
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}