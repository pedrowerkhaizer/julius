# Julius - Seu Assistente Financeiro

Um aplicativo web para controle financeiro pessoal com foco em limites diários e projeções mensais.

## Objetivo

- Oferecer uma visão consolidada das suas finanças, com foco em controle de gastos diários, limites por categoria e acompanhamento de transações em tempo real.
- Automatizar a sincronização de dados bancários, eliminando lançamentos manuais.
- Ajudar o usuário a tomar decisões melhores com base em dados reais e projeções inteligentes.

## Funcionalidades

### ✅ Implementadas
- **Autenticação**: Login e cadastro com Supabase
- **Timeline de Eventos**: Cadastro de entradas e saídas recorrentes e únicas
- **Tipos de Despesa**: Fixas, variáveis e assinaturas
- **KPIs**: Visualização de entradas, saídas, performance e saldo das contas
- **Notificações**: Configuração de notificações WhatsApp
- **Onboarding**: Configuração inicial com contas bancárias
- **Ajustes**: Gerenciamento de perfil e contas bancárias

### 🔄 Em Desenvolvimento
- **Conexão Bancária**: Integração com Open Finance via Pluggy
- **Limites Diários**: Cálculo automático de limites baseado no saldo
- **Sincronização**: Atualização automática de transações

## Estrutura do Projeto

```
bolt-julius/
├── app/                    # Páginas Next.js
│   ├── ajustes/           # Configurações do usuário
│   ├── auth/              # Autenticação
│   ├── home/              # Dashboard principal
│   ├── login/             # Página de login
│   ├── onboarding/        # Configuração inicial
│   └── signup/            # Página de cadastro
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── providers/        # Providers (theme, etc.)
├── lib/                  # Utilitários e configurações
└── hooks/                # Hooks customizados
```

## Sistema de Contas Bancárias

### Como Funciona

O sistema de contas bancárias permite que os usuários:

1. **Configurem contas no onboarding**: Adicionem contas correntes e poupanças com saldos iniciais
2. **Ajustem saldos posteriormente**: Atualizem valores na página de ajustes
3. **Visualizem saldo total**: Vejam o saldo consolidado no dashboard

### Estrutura de Dados

```typescript
interface BankAccount {
  id: string;
  name: string;           // Nome da conta (ex: "Conta Principal")
  bank: string;           // ID do banco (ex: "nubank", "itau")
  accountType: 'checking' | 'savings';  // Tipo de conta
  balance: number;        // Saldo atual
}
```

### Implementação no Banco de Dados

Para implementar a persistência no Supabase, crie a seguinte tabela:

```sql
-- Tabela para contas bancárias
CREATE TABLE bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_created_at ON bank_accounts(created_at);

-- RLS (Row Level Security)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias contas
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários só podem inserir suas próprias contas
CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar suas próprias contas
CREATE POLICY "Users can update own bank accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários só podem deletar suas próprias contas
CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = user_id);
```

### Funções para Integração

Substitua as funções que usam localStorage pelas seguintes:

```typescript
// Carregar contas do Supabase
async function fetchBankAccounts() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar contas:', error);
    toast.error('Erro ao carregar contas bancárias');
  } else {
    setBankAccounts(data || []);
  }
}

// Adicionar nova conta
async function addBankAccount(account: Omit<BankAccount, 'id'>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([{
      user_id: userData.user.id,
      name: account.name,
      bank: account.bank,
      account_type: account.accountType,
      balance: account.balance
    }])
    .select();

  if (error) {
    console.error('Erro ao adicionar conta:', error);
    toast.error('Erro ao adicionar conta');
  } else {
    toast.success('Conta adicionada com sucesso!');
    await fetchBankAccounts(); // Recarregar lista
  }
}

// Atualizar conta
async function updateBankAccount(id: string, updates: Partial<BankAccount>) {
  const { error } = await supabase
    .from('bank_accounts')
    .update({
      name: updates.name,
      bank: updates.bank,
      account_type: updates.accountType,
      balance: updates.balance,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar conta:', error);
    toast.error('Erro ao atualizar conta');
  } else {
    toast.success('Conta atualizada com sucesso!');
    await fetchBankAccounts(); // Recarregar lista
  }
}

// Remover conta
async function removeBankAccount(id: string) {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao remover conta:', error);
    toast.error('Erro ao remover conta');
  } else {
    toast.success('Conta removida com sucesso!');
    await fetchBankAccounts(); // Recarregar lista
  }
}
```

## Próximos Passos

1. **Implementar persistência**: Substituir localStorage pelas funções do Supabase
2. **Cálculo de limites**: Implementar lógica para calcular limites diários baseado no saldo
3. **Integração Pluggy**: Conectar com Open Finance para sincronização automática
4. **Notificações reais**: Implementar envio de notificações WhatsApp
5. **Relatórios**: Adicionar relatórios detalhados e gráficos

## Tecnologias

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database)
- **Deploy**: Vercel (recomendado)

## Como Executar

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente do Supabase
4. Execute: `npm run dev`
5. Acesse: `http://localhost:3000`

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Dicas e Observações

- **Nunca exponha suas credenciais Pluggy no frontend!**
- O backend deve rodar em localhost:3001 por padrão (ajuste se necessário).
- O sistema é responsivo e pode ser usado normalmente em celulares.
- Se não houver banco conectado, a interface mostra mensagens amigáveis e orienta o usuário.
- Os dados de limites e recorrentes são mockados/localmente, mas podem ser integrados ao backend futuramente.

## Roadmap

- Integração de limites e recorrentes com backend/Pluggy
- Projeções financeiras automáticas
- Exportação de relatórios
- Notificações inteligentes

## Licença

MIT

---

Desenvolvido por [@pedrowerkhaizer](https://github.com/pedrowerkhaizer) 