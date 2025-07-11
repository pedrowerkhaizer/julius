-- =====================================================
-- MIGRAÇÕES SUPABASE - SISTEMA DE CONTAS BANCÁRIAS
-- Integração com modelo existente
-- =====================================================

-- 1. CRIAR TABELA DE CONTAS BANCÁRIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE (seguindo padrão existente)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_created ON bank_accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank ON bank_accounts(bank);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(account_type);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS) - seguindo padrão existente
-- =====================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA (seguindo padrão das outras tabelas)
-- =====================================================

-- Política: usuários só podem ver suas próprias contas
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários só podem inserir suas próprias contas
CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar suas próprias contas
CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários só podem deletar suas próprias contas
CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 5. CRIAR TRIGGER PARA ATUALIZAR TIMESTAMP (usando função existente)
-- =====================================================

-- Verificar se a função set_updated_at existe e criar se necessário
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar timestamp automaticamente
CREATE TRIGGER set_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. CRIAR FUNÇÃO PARA CALCULAR SALDO TOTAL DO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_total_balance(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(balance) FROM bank_accounts WHERE user_id = user_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR VIEW PARA RESUMO DE CONTAS (OPCIONAL)
-- =====================================================

CREATE OR REPLACE VIEW user_accounts_summary AS
SELECT 
  user_id,
  COUNT(*) as total_accounts,
  COUNT(*) FILTER (WHERE account_type = 'checking') as checking_accounts,
  COUNT(*) FILTER (WHERE account_type = 'savings') as savings_accounts,
  SUM(balance) as total_balance,
  SUM(balance) FILTER (WHERE account_type = 'checking') as checking_balance,
  SUM(balance) FILTER (WHERE account_type = 'savings') as savings_balance,
  MAX(updated_at) as last_updated
FROM bank_accounts
GROUP BY user_id;

-- 8. CRIAR POLÍTICA PARA A VIEW
-- =====================================================

CREATE POLICY "Users can view their own account summary" ON user_accounts_summary
  FOR SELECT USING (auth.uid() = user_id);

-- 9. CRIAR TABELA DE CONFIGURAÇÕES DE ONBOARDING (OPCIONAL)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 28),
  card_due_day INTEGER CHECK (card_due_day >= 1 AND card_due_day <= 28),
  onboarding_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para onboarding
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(onboarding_completed);

-- RLS para onboarding
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Políticas para onboarding
CREATE POLICY "Users can view their own onboarding" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding" ON user_onboarding
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para onboarding
CREATE TRIGGER set_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 10. FUNÇÕES AUXILIARES PARA O FRONTEND
-- =====================================================

-- Função para buscar contas de um usuário
CREATE OR REPLACE FUNCTION get_user_bank_accounts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bank TEXT,
  account_type TEXT,
  balance DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.id,
    ba.name,
    ba.bank,
    ba.account_type,
    ba.balance,
    ba.created_at,
    ba.updated_at
  FROM bank_accounts ba
  WHERE ba.user_id = user_uuid
  ORDER BY ba.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar nova conta
CREATE OR REPLACE FUNCTION add_bank_account(
  user_uuid UUID,
  account_name TEXT,
  bank_name TEXT,
  account_type TEXT,
  initial_balance DECIMAL(10,2)
)
RETURNS UUID AS $$
DECLARE
  new_account_id UUID;
BEGIN
  INSERT INTO bank_accounts (user_id, name, bank, account_type, balance)
  VALUES (user_uuid, account_name, bank_name, account_type, initial_balance)
  RETURNING id INTO new_account_id;
  
  RETURN new_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar conta
CREATE OR REPLACE FUNCTION update_bank_account(
  account_uuid UUID,
  user_uuid UUID,
  account_name TEXT,
  bank_name TEXT,
  account_type TEXT,
  new_balance DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE bank_accounts 
  SET 
    name = account_name,
    bank = bank_name,
    account_type = account_type,
    balance = new_balance,
    updated_at = timezone('utc'::text, now())
  WHERE id = account_uuid AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para salvar configuração de onboarding
CREATE OR REPLACE FUNCTION save_onboarding_config(
  user_uuid UUID,
  payment_day INTEGER,
  card_due_day INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_onboarding (user_id, payment_day, card_due_day, onboarding_completed, completed_at)
  VALUES (user_uuid, payment_day, card_due_day, true, timezone('utc'::text, now()))
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    payment_day = EXCLUDED.payment_day,
    card_due_day = EXCLUDED.card_due_day,
    onboarding_completed = true,
    completed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar configuração de onboarding
CREATE OR REPLACE FUNCTION get_onboarding_config(user_uuid UUID)
RETURNS TABLE (
  payment_day INTEGER,
  card_due_day INTEGER,
  onboarding_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uo.payment_day,
    uo.card_due_day,
    uo.onboarding_completed,
    uo.completed_at
  FROM user_onboarding uo
  WHERE uo.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. MIGRAÇÃO DE DADOS DO LOCALSTORAGE (FUNÇÃO AUXILIAR)
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_localstorage_accounts(
  user_uuid UUID,
  accounts_json JSONB,
  payment_day INTEGER DEFAULT NULL,
  card_due_day INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  account_record JSONB;
  accounts_count INTEGER := 0;
BEGIN
  -- Salvar configuração de onboarding se fornecida
  IF payment_day IS NOT NULL AND card_due_day IS NOT NULL THEN
    PERFORM save_onboarding_config(user_uuid, payment_day, card_due_day);
  END IF;

  -- Migrar contas bancárias
  FOR account_record IN SELECT * FROM jsonb_array_elements(accounts_json)
  LOOP
    INSERT INTO bank_accounts (
      user_id, 
      name, 
      bank, 
      account_type, 
      balance
    ) VALUES (
      user_uuid,
      account_record->>'name',
      account_record->>'bank',
      account_record->>'accountType',
      (account_record->>'balance')::DECIMAL(10,2)
    );
    accounts_count := accounts_count + 1;
  END LOOP;
  
  RETURN accounts_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. INSERIR DADOS DE EXEMPLO (OPCIONAL - PARA TESTES)
-- =====================================================

-- Descomente e ajuste os UUIDs se quiser inserir dados de exemplo
/*
INSERT INTO bank_accounts (user_id, name, bank, account_type, balance) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Conta Principal', 'nubank', 'checking', 5000.00),
  ('00000000-0000-0000-0000-000000000001', 'Poupança', 'nubank', 'savings', 15000.00),
  ('00000000-0000-0000-0000-000000000001', 'Conta Secundária', 'itau', 'checking', 2500.00);

INSERT INTO user_onboarding (user_id, payment_day, card_due_day, onboarding_completed, completed_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 5, 15, true, timezone('utc'::text, now()));
*/

-- =====================================================
-- COMANDOS PARA VERIFICAR A IMPLEMENTAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
-- SELECT * FROM information_schema.tables WHERE table_name IN ('bank_accounts', 'user_onboarding');

-- Verificar as políticas RLS
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('bank_accounts', 'user_onboarding');

-- Verificar os índices
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('bank_accounts', 'user_onboarding');

-- Testar a função de saldo total (substitua o UUID)
-- SELECT get_user_total_balance('00000000-0000-0000-0000-000000000001');

-- Verificar triggers
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table IN ('bank_accounts', 'user_onboarding');

-- =====================================================
-- TABELAS DE CARTÕES DE CRÉDITO
-- =====================================================

-- Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  bank_id TEXT NOT NULL, -- ID do banco para compatibilidade
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
  limit DECIMAL(10,2),
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para cartões de crédito
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_created ON credit_cards(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank ON credit_cards(bank);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Política RLS para cartões de crédito
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit cards" ON credit_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards" ON credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards" ON credit_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards" ON credit_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Tabela de faturas de cartão de crédito
CREATE TABLE IF NOT EXISTS credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'), -- Formato YYYY-MM
  value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(credit_card_id, month)
);

-- Índices para faturas
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_user ON credit_card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_card ON credit_card_invoices(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_month ON credit_card_invoices(month);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_credit_card_invoices_updated_at
  BEFORE UPDATE ON credit_card_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Política RLS para faturas
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit card invoices" ON credit_card_invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit card invoices" ON credit_card_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit card invoices" ON credit_card_invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit card invoices" ON credit_card_invoices
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================

/*
-- Para reverter todas as mudanças:
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS credit_card_invoices CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP VIEW IF EXISTS user_accounts_summary;
DROP FUNCTION IF EXISTS get_user_total_balance(UUID);
DROP FUNCTION IF EXISTS get_user_bank_accounts(UUID);
DROP FUNCTION IF EXISTS add_bank_account(UUID, TEXT, TEXT, TEXT, DECIMAL);
DROP FUNCTION IF EXISTS update_bank_account(UUID, UUID, TEXT, TEXT, TEXT, DECIMAL);
DROP FUNCTION IF EXISTS save_onboarding_config(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_onboarding_config(UUID);
DROP FUNCTION IF EXISTS migrate_localstorage_accounts(UUID, JSONB, INTEGER, INTEGER);
*/ 