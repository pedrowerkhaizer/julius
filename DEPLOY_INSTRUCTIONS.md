# 🚀 Deploy Rápido - Julius Financeiro

## ✅ Checklist Pré-Deploy

- [ ] Projeto builda localmente (`npm run build`)
- [ ] Repositório Git configurado
- [ ] Conta Vercel criada
- [ ] Projeto Supabase configurado

## 🔧 Configuração Rápida

### 1. Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique "New Project"
3. Conecte seu repositório
4. Configure as variáveis de ambiente:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Supabase
1. Execute o script `supabase_migrations.sql` no SQL Editor
2. Configure Authentication > Settings:
   - Site URL: `https://seu-app.vercel.app`
   - Redirect URLs: 
     - `https://seu-app.vercel.app/auth/callback`
     - `https://seu-app.vercel.app/login`

### 3. Deploy
1. Clique "Deploy" no Vercel
2. Aguarde o build
3. Acesse sua URL

## 🛠️ Comandos Úteis

```bash
# Testar build local
npm run build

# Executar script de deploy
./scripts/deploy.sh

# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 📞 Suporte

- **Build falha**: Verifique variáveis de ambiente
- **Auth não funciona**: Configure URLs no Supabase
- **DB errors**: Execute migrations SQL

## 📚 Documentação Completa

Consulte `DEPLOY.md` para instruções detalhadas. 