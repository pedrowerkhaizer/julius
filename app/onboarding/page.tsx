"use client";

import { useState } from 'react';
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
  Info
} from 'lucide-react';
import { toast } from 'sonner';

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

  const handleFinish = () => {
    if (!formData.paymentDay || !formData.cardDueDay) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Simulate saving onboarding data
    localStorage.setItem('julius_onboarding', JSON.stringify({
      completed: true,
      paymentDay: formData.paymentDay,
      cardDueDay: formData.cardDueDay,
      completedAt: new Date().toISOString()
    }));

    toast.success('Configuração inicial concluída!');
    router.push('/home');
  };

  const handlePluggyConnect = () => {
    // Simulate Pluggy connection
    toast.info('Abrindo conexão segura com seu banco...');
    
    setTimeout(() => {
      setFormData(prev => ({ ...prev, consentGiven: true }));
      toast.success('Conexão estabelecida com sucesso!');
    }, 2000);
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
              {currentStep === 3 && <Shield className="w-5 h-5 text-indigo-500" />}
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

            {/* Step 3: Bank Connection */}
            {currentStep === 3 && (
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