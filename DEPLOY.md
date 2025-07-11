# Deploy na Vercel - Julius Financeiro

## Pré-requisitos

1. **Conta na Vercel**: Crie uma conta em [vercel.com](https://vercel.com)
2. **Projeto Supabase**: Configure seu projeto Supabase com as tabelas necessárias
3. **Repositório Git**: Seu código deve estar em um repositório Git (GitHub, GitLab, etc.)

## Passos para Deploy

### 1. Preparar o Projeto

Certifique-se de que seu projeto está pronto para deploy:

```bash
# Instalar dependências
npm install

# Testar build local
npm run build
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Selecione o repositório do Julius

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

**Como obter essas variáveis:**
1. Acesse seu projeto no Supabase
2. Vá em **Settings > API**
3. Copie a **Project URL** e **anon public** key

### 4. Configurar Banco de Dados

Execute o script SQL do arquivo `supabase_migrations.sql` no seu projeto Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase_migrations.sql`
4. Execute o script

### 5. Configurar Autenticação

No Supabase Dashboard:

1. Vá em **Authentication > Settings**
2. Em **Site URL**, adicione sua URL da Vercel (ex: `https://seu-app.vercel.app`)
3. Em **Redirect URLs**, adicione:
   - `https://seu-app.vercel.app/auth/callback`
   - `https://seu-app.vercel.app/login`

### 6. Deploy

1. No Vercel, clique em **Deploy**
2. Aguarde o build completar
3. Acesse sua URL de produção

## Configurações Importantes

### Build Settings (Vercel)

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Domínio Customizado (Opcional)

1. No Vercel, vá em **Settings > Domains**
2. Adicione seu domínio customizado
3. Configure os registros DNS conforme instruído

## Troubleshooting

### Erro de Build

Se o build falhar, verifique:

1. **Variáveis de ambiente**: Certifique-se de que estão configuradas corretamente
2. **Dependências**: Verifique se todas as dependências estão no `package.json`
3. **TypeScript**: Execute `npm run lint` localmente para verificar erros

### Erro de Autenticação

Se a autenticação não funcionar:

1. Verifique as URLs no Supabase Dashboard
2. Certifique-se de que as variáveis de ambiente estão corretas
3. Teste o login em modo de desenvolvimento primeiro

### Erro de Banco de Dados

Se houver problemas com o banco:

1. Verifique se as tabelas foram criadas corretamente
2. Confirme as políticas RLS (Row Level Security)
3. Teste as queries no Supabase Dashboard

## Monitoramento

### Logs

- Acesse os logs no Vercel Dashboard
- Monitore erros em tempo real
- Configure alertas se necessário

### Analytics

- Configure Google Analytics (opcional)
- Monitore performance no Vercel Analytics

## Atualizações

Para atualizar o app:

1. Faça push para o repositório
2. O Vercel fará deploy automático
3. Monitore o build e logs

## Suporte

Se precisar de ajuda:

1. Verifique os logs no Vercel Dashboard
2. Teste localmente primeiro
3. Consulte a documentação do Next.js e Supabase 