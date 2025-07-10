#!/bin/bash

# Script de Deploy para Vercel
echo "🚀 Preparando deploy do Julius Financeiro..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f ".env.local" ]; then
    echo "⚠️  Aviso: Arquivo .env.local não encontrado"
    echo "📝 Crie um arquivo .env.local com as seguintes variáveis:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase"
    echo ""
    echo "💡 Você pode obter essas variáveis no Supabase Dashboard > Settings > API"
fi

# Testar build local
echo "🔨 Testando build local..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build local bem-sucedido!"
    echo ""
    echo "🎯 Próximos passos para deploy na Vercel:"
    echo "1. Acesse https://vercel.com"
    echo "2. Conecte seu repositório Git"
    echo "3. Configure as variáveis de ambiente:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "4. Execute o script SQL do arquivo supabase_migrations.sql no Supabase"
    echo "5. Configure as URLs de redirecionamento no Supabase Dashboard"
    echo ""
    echo "📚 Consulte o arquivo DEPLOY.md para instruções detalhadas"
else
    echo "❌ Erro no build local. Verifique os erros acima."
    exit 1
fi 