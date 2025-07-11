# Julius Backend API

Backend Node.js/Express para o Julius - Assistente Financeiro via WhatsApp.

## 🚀 Funcionalidades

- **KPIs Financeiros**: Cálculo de entradas, saídas, despesas fixas/variáveis, performance
- **Saldo Atual**: Consulta de saldo das contas bancárias
- **Saldo Projetado**: Projeção de saldo futuro considerando transações recorrentes
- **Simulação de Compras**: Análise de impacto de compras no saldo projetado
- **Autenticação**: Verificação de tokens JWT do Supabase

## 📋 Pré-requisitos

- Node.js 18+
- Supabase (banco de dados)
- Conta no n8n (para orquestração do WhatsApp)

## 🛠️ Instalação

1. **Clone o repositório**
```bash
cd backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3001
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
FRONTEND_URL=http://localhost:3000
```

4. **Execute o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/verify` - Verificar token
- `GET /api/auth/profile` - Obter perfil do usuário

### KPIs
- `GET /api/kpis` - Obter todos os KPIs
- `GET /api/kpis/:kpiKey` - Obter KPI específico

**Parâmetros de query:**
- `period`: `current` | `next` | `3months` | `custom`
- `customStart`: Data inicial (formato YYYY-MM-DD)
- `customEnd`: Data final (formato YYYY-MM-DD)

### Saldo
- `GET /api/balance/current` - Saldo atual
- `GET /api/balance/projected` - Saldo projetado
- `POST /api/balance/simulate-purchase` - Simular compra

### Simulações
- `POST /api/simulation/purchase` - Simular compra única
- `POST /api/simulation/multiple-purchases` - Simular múltiplas compras

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação

## 🔐 Autenticação

Todas as rotas (exceto `/api/auth/verify`) requerem autenticação via Bearer Token:

```
Authorization: Bearer seu_jwt_token_aqui
```

## 📊 Exemplos de Uso

### 1. Obter KPIs do mês atual
```bash
curl -H "Authorization: Bearer seu_token" \
  "http://localhost:3001/api/kpis?period=current"
```

### 2. Consultar saldo atual
```bash
curl -H "Authorization: Bearer seu_token" \
  "http://localhost:3001/api/balance/current"
```

### 3. Simular compra de R$ 500
```bash
curl -X POST -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "description": "Compra de roupas"}' \
  "http://localhost:3001/api/simulation/purchase"
```

### 4. Obter saldo projetado para 30 dias
```bash
curl -H "Authorization: Bearer seu_token" \
  "http://localhost:3001/api/balance/projected?projectionDate=2024-02-15"
```

## 🔄 Integração com n8n

### Fluxo básico para WhatsApp:

1. **Receber mensagem do WhatsApp**
2. **Interpretar comando** (ex: "saldo", "kpis", "simular 500")
3. **Chamar API do Julius**
4. **Formatar resposta**
5. **Enviar para WhatsApp**

### Exemplo de nó HTTP Request no n8n:

```javascript
// Configuração do nó HTTP Request
{
  "method": "GET",
  "url": "http://localhost:3001/api/balance/current",
  "headers": {
    "Authorization": "Bearer {{ $json.token }}",
    "Content-Type": "application/json"
  }
}
```

### Exemplo de resposta formatada:

```javascript
// Processar resposta da API
const balance = $input.all()[0].json.data;
const message = `💰 Seu saldo atual é R$ ${balance.totalBalance.toFixed(2)}`;

return { message };
```

## 🧪 Testes

```bash
npm test
```

## 📝 Logs

O servidor registra logs detalhados para debugging:

- Requisições HTTP
- Erros de autenticação
- Cálculos de KPIs
- Simulações de compra

## 🔧 Configuração de Produção

1. **Variáveis de ambiente**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=sua_url_producao
SUPABASE_SERVICE_ROLE_KEY=sua_key_producao
FRONTEND_URL=https://seu-dominio.com
```

2. **Process Manager (PM2)**
```bash
npm install -g pm2
pm2 start src/server.js --name julius-backend
```

3. **Nginx (opcional)**
```nginx
server {
    listen 80;
    server_name api.julius.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes. 