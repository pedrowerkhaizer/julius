import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug: verificar se as variáveis estão definidas
console.log('Supabase URL:', supabaseUrl ? 'Definida' : 'NÃO DEFINIDA');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Definida' : 'NÃO DEFINIDA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não estão configuradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'NÃO DEFINIDA');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Função para buscar perfil do usuário
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Função para atualizar perfil do usuário
export async function updateUserProfile(userId: string, updates: Partial<{ nome: string; avatar_url: string; whatsapp: string; notificacoes: any; onboarding_completed?: boolean; }>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Função para criar perfil do usuário (caso não exista)
export async function createUserProfile(userId: string, email: string, nome?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, email, nome }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Função para upload de avatar
export async function uploadUserAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  // Corrigir: não inclua 'avatars/' no filePath, só o nome do arquivo ou subpasta
  const filePath = `${userId}.${fileExt}`;
  const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
  if (error) {
    if (error.message.includes('bucket not found')) {
      throw new Error("Bucket 'avatars' não encontrado no Supabase Storage. Crie um bucket público chamado 'avatars' para armazenar as fotos de perfil.");
    }
    throw error;
  }
  // Retorna a URL pública
  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
} 