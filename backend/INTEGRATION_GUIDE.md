# Guia de Integração n8n + Julius Backend

Este guia mostra como integrar o n8n com o backend do Julius para criar um assistente financeiro via WhatsApp.

## 🎯 Objetivo

Criar um fluxo no n8n que:
1. Recebe mensagens do WhatsApp
2. Interpreta comandos do usuário
3. Chama a API do Julius
4. Retorna respostas formatadas

## 📋 Pré-requisitos

- n8n configurado e funcionando
- Backend do Julius rodando
- Conexão com WhatsApp (via Baileys, WhatsApp Business API, etc.)
- Token de autenticação do usuário

## 🔧 Configuração do n8n

### 1. Configurar Webhook para WhatsApp

```javascript
// Webhook para receber mensagens do WhatsApp
{
  "httpMethod": "POST",
  "path": "whatsapp-webhook",
  "responseMode": "responseNode",
  "options": {}
}
```

### 2. Configurar Autenticação

```javascript
// Nó Set para configurar token de autenticação
{
  "token": "seu_jwt_token_aqui",
  "baseUrl": "http://localhost:3001/api"
}
```

## 📱 Comandos do WhatsApp

### Comandos Básicos

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `saldo` | Saldo atual | "saldo" |
| `kpis` | KPIs do mês | "kpis" |
| `projecao` | Saldo projetado | "projecao" |
| `simular 500` | Simular compra | "simular 500" |
| `ajuda` | Lista de comandos | "ajuda" |

### Comandos Avançados

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `kpis proximo` | KPIs do próximo mês | "kpis proximo" |
| `projecao 2024-02-15` | Projeção até data específica | "projecao 2024-02-15" |
| `simular 500 roupas` | Simular compra com descrição | "simular 500 roupas" |

## 🔄 Fluxo no n8n

### Estrutura do Fluxo

```
WhatsApp Webhook → Interpretar Comando → Chamar API → Formatar Resposta → Enviar WhatsApp
```

### 1. Nó Webhook (Entrada)

```javascript
// Configuração do webhook
{
  "httpMethod": "POST",
  "path": "whatsapp",
  "responseMode": "responseNode"
}
```

### 2. Nó Code (Interpretar Comando)

```javascript
// Interpretar mensagem do WhatsApp
const message = $input.all()[0].json.message?.text?.toLowerCase() || '';
const from = $input.all()[0].json.message?.from;

// Comandos disponíveis
const commands = {
  'saldo': 'GET /api/balance/current',
  'kpis': 'GET /api/kpis?period=current',
  'projecao': 'GET /api/balance/projected',
  'ajuda': 'HELP'
};

// Interpretar comando
let command = null;
let params = {};

if (message.includes('simular')) {
  const match = message.match(/simular\s+(\d+(?:\.\d+)?)\s*(.*)/);
  if (match) {
    command = 'POST /api/simulation/purchase';
    params = {
      amount: parseFloat(match[1]),
      description: match[2] || 'Compra simulada'
    };
  }
} else if (message.includes('kpis') && message.includes('proximo')) {
  command = 'GET /api/kpis?period=next';
} else if (message.includes('projecao')) {
  const match = message.match(/projecao\s+(\d{4}-\d{2}-\d{2})/);
  if (match) {
    command = 'GET /api/balance/projected';
    params = { projectionDate: match[1] };
  } else {
    command = 'GET /api/balance/projected';
  }
} else {
  command = commands[message] || 'HELP';
}

return {
  command,
  params,
  from,
  originalMessage: message
};
```

### 3. Nó Switch (Roteamento)

```javascript
// Configurar casos baseados no comando
const command = $input.all()[0].json.command;

// Casos:
// - GET /api/balance/current
// - GET /api/kpis?period=current
// - GET /api/balance/projected
// - POST /api/simulation/purchase
// - HELP
```

### 4. Nó HTTP Request (Chamar API)

```javascript
// Exemplo para saldo atual
{
  "method": "GET",
  "url": "http://localhost:3001/api/balance/current",
  "headers": {
    "Authorization": "Bearer {{ $('Set').item.json.token }}",
    "Content-Type": "application/json"
  }
}
```

### 5. Nó Code (Formatar Resposta)

```javascript
// Formatar resposta baseada no tipo de comando
const command = $('Code').item.json.command;
const data = $input.all()[0].json.data;

let message = '';

switch (command) {
  case 'GET /api/balance/current':
    message = `💰 *Saldo Atual*
    
💵 Total: R$ ${data.totalBalance.toFixed(2)}
📊 Contas: ${data.accounts.length}

${data.accounts.map(acc => 
  `🏦 ${acc.name}: R$ ${acc.balance.toFixed(2)}`
).join('\n')}`;
    break;

  case 'GET /api/kpis?period=current':
    const kpis = data.kpis;
    message = `📊 *KPIs do Mês*
    
💰 Entradas: R$ ${kpis.find(k => k.key === 'income')?.value.toFixed(2) || '0,00'}
💸 Saídas: R$ ${kpis.find(k => k.key === 'expense')?.value.toFixed(2) || '0,00'}
📈 Performance: R$ ${kpis.find(k => k.key === 'performance')?.value.toFixed(2) || '0,00'}
🏦 Saldo: R$ ${kpis.find(k => k.key === 'balance')?.value.toFixed(2) || '0,00'}`;
    break;

  case 'GET /api/balance/projected':
    message = `🔮 *Saldo Projetado*
    
💰 Saldo atual: R$ ${data.currentBalance.toFixed(2)}
🔮 Projetado: R$ ${data.projectedBalance.toFixed(2)}
📅 Data: ${new Date(data.projectionDate).toLocaleDateString('pt-BR')}

*Detalhamento:*
➕ Entradas: R$ ${data.details.entradas.toFixed(2)}
➖ Fixas: R$ ${data.details.fixas.toFixed(2)}
➖ Variáveis: R$ ${data.details.variaveis.toFixed(2)}
➖ Assinaturas: R$ ${data.details.assinaturas.toFixed(2)}
➖ Faturas: R$ ${data.details.faturas.toFixed(2)}`;
    break;

  case 'POST /api/simulation/purchase':
    const simulation = data;
    const emoji = simulation.details.canAfford ? '✅' : '⚠️';
    message = `🛒 *Simulação de Compra*
    
${emoji} ${simulation.recommendation}

💰 Valor: R$ ${simulation.purchase.amount.toFixed(2)}
📝 Descrição: ${simulation.purchase.description}
💵 Saldo atual: R$ ${simulation.currentBalance.toFixed(2)}
🔮 Saldo após compra: R$ ${simulation.projectedBalanceWithPurchase.toFixed(2)}
⚠️ Risco: ${simulation.details.riskLevel}

${simulation.details.warning || ''}`;
    break;

  default:
    message = `🤖 *Julius - Assistente Financeiro*

*Comandos disponíveis:*

💰 *saldo* - Ver saldo atual
📊 *kpis* - KPIs do mês atual
🔮 *projecao* - Saldo projetado
🛒 *simular [valor]* - Simular compra
❓ *ajuda* - Ver esta mensagem

*Exemplos:*
• "saldo"
• "kpis"
• "projecao"
• "simular 500"
• "simular 1500 roupas"`;
}

return { message };
```

### 6. Nó WhatsApp (Enviar Resposta)

```javascript
// Configuração para enviar mensagem
{
  "to": "{{ $('Code').item.json.from }}",
  "message": "{{ $('Format Response').item.json.message }}",
  "type": "text"
}
```

## 📊 Exemplos de Respostas

### Saldo Atual
```
💰 Saldo Atual

💵 Total: R$ 5.234,56
📊 Contas: 2

🏦 Conta Principal: R$ 3.234,56
🏦 Poupança: R$ 2.000,00
```

### KPIs do Mês
```
📊 KPIs do Mês

💰 Entradas: R$ 3.500,00
💸 Saídas: R$ 2.800,00
📈 Performance: R$ 700,00
🏦 Saldo: R$ 5.234,56
```

### Simulação de Compra
```
🛒 Simulação de Compra

✅ Você pode fazer esta compra com segurança

💰 Valor: R$ 500,00
📝 Descrição: Roupas
💵 Saldo atual: R$ 5.234,56
🔮 Saldo após compra: R$ 4.734,56
⚠️ Risco: BAIXO
```

## 🔧 Configuração Avançada

### 1. Tratamento de Erros

```javascript
// Nó Code para tratamento de erros
const response = $input.all()[0].json;

if (!response.success) {
  return {
    message: `❌ *Erro*
    
${response.error}

Tente novamente ou contate o suporte.`
  };
}
```

### 2. Cache de Tokens

```javascript
// Armazenar token em variável global
const token = $('Set').item.json.token;
$global.set('julius_token', token);
```

### 3. Logs de Atividade

```javascript
// Registrar atividade
const activity = {
  user: $('Code').item.json.from,
  command: $('Code').item.json.command,
  timestamp: new Date().toISOString()
};

// Salvar em banco ou arquivo
```

## 🚀 Deploy

### 1. n8n Cloud
- Use n8n.cloud para hospedagem
- Configure webhooks públicos
- Use variáveis de ambiente para tokens

### 2. Self-hosted
- Docker: `docker run -it --rm n8nio/n8n`
- PM2: `pm2 start n8n --name julius-whatsapp`

### 3. Monitoramento
- Configure alertas para falhas
- Monitore uso da API
- Logs de atividade

## 🔒 Segurança

### 1. Autenticação
- Use tokens JWT válidos
- Implemente rate limiting
- Valide origem das mensagens

### 2. Dados Sensíveis
- Não exponha tokens no código
- Use variáveis de ambiente
- Criptografe dados sensíveis

### 3. Logs
- Não logue dados financeiros
- Implemente rotação de logs
- Configure retenção adequada

## 📈 Monitoramento

### Métricas Importantes
- Taxa de sucesso das requisições
- Tempo de resposta da API
- Uso de comandos por usuário
- Erros de autenticação

### Alertas
- Falhas na API do Julius
- Erros de autenticação
- Tempo de resposta alto
- Uso excessivo de recursos

## 🎯 Próximos Passos

1. **Implementar comandos avançados**
   - Histórico de transações
   - Configuração de metas
   - Alertas personalizados

2. **Melhorar UX**
   - Botões interativos
   - Menus estruturados
   - Respostas mais ricas

3. **Analytics**
   - Dashboard de uso
   - Relatórios de performance
   - Insights de comportamento

4. **Integrações**
   - Telegram
   - Discord
   - Email
   - Push notifications 