# Julius - Seu Assistente Financeiro

Julius é um assistente financeiro pessoal que conecta suas contas bancárias via Open Finance (Pluggy), centralizando informações de saldo, transações, limites e projeções financeiras em uma interface moderna, responsiva e fácil de usar.

## Objetivo

- Oferecer uma visão consolidada das suas finanças, com foco em controle de gastos diários, limites por categoria e acompanhamento de transações em tempo real.
- Automatizar a sincronização de dados bancários, eliminando lançamentos manuais.
- Ajudar o usuário a tomar decisões melhores com base em dados reais e projeções inteligentes.

## Funcionalidades

- **Conexão bancária segura** via Pluggy/Open Finance.
- **Dashboard com timeline de eventos**: transações passadas, projeções futuras, agrupamento por data.
- **Resumo financeiro**: saldo atual, gastos do dia, limite diário/restante.
- **Limites por categoria e método de pagamento**: defina quanto pode gastar em cada área.
- **Transações recorrentes**: cadastre salários, contas fixas e receitas/despesas automáticas.
- **Filtros de período**: visualize eventos por semana, mês, período personalizado, etc.
- **Interface responsiva**: experiência fluida em desktop e mobile.
- **Notificações e feedbacks visuais** para ações importantes.

## Tecnologias

- **Next.js 13+** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Pluggy SDK** (backend)
- **react-pluggy-connect** (frontend)
- **Express.js** (backend separado para integração segura com Pluggy)

## Estrutura do Projeto

```
bolt-julius/           # Frontend Next.js
bolt-backend/          # Backend Express/Node.js (Pluggy)
```

## Como funciona o fluxo Pluggy

1. O usuário clica em "Conectar banco" e autentica via Pluggy Connect.
2. O backend gera um `connectToken` e retorna ao frontend.
3. Após a conexão, o Pluggy retorna um `itemId` (identificador da conexão bancária).
4. O frontend salva o `itemId` e passa a buscar dados reais do backend:
    - Saldo atual
    - Transações
    - Faturas futuras
5. O backend consulta a API Pluggy e retorna os dados para o frontend.
6. A interface exibe tudo em tempo real, agrupando, filtrando e projetando eventos.

## Como rodar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/pedrowerkhaizer/julius.git
cd julius/bolt-julius
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Configure o backend (em pasta separada)

- Siga as instruções do backend (Express/Node.js) para instalar dependências, configurar `.env` com suas credenciais Pluggy e rodar o servidor.
- O backend deve expor endpoints como:
    - `/pluggy/connect-token` (POST)
    - `/pluggy/:itemId/accounts` (GET)
    - `/pluggy/:itemId/transactions` (GET)
    - `/pluggy/:itemId/invoices` (GET, opcional)

### 4. Rode o frontend

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### 5. Fluxo de uso

1. Acesse a tela de bancos e clique em "Conectar banco via Pluggy".
2. Faça a autenticação no banco desejado.
3. Após conectar, o sistema salva o `itemId` e carrega os dados reais.
4. Navegue pelas telas de timeline, limites, recorrentes, etc.

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