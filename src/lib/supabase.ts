import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 *
 * Configura o cliente Supabase para usar em toda a aplicação.
 * Utiliza variáveis de ambiente para URL e chave anônima.
 *
 * Recursos configurados:
 * - Persistência de sessão no localStorage
 * - Auto-refresh de token
 * - Detecção automática de mudanças de sessão
 */

// Busca as credenciais do Supabase das variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

/**
 * Cliente Supabase singleton
 * Configurado com persistência de sessão e auto-refresh
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste a sessão no localStorage do navegador
    persistSession: true,

    // Detecta automaticamente mudanças de sessão
    autoRefreshToken: true,

    // Detecta se o usuário está em múltiplas abas
    detectSessionInUrl: true,

    // Configuração de armazenamento
    storage: window.localStorage,
  },
});

/**
 * Tipos TypeScript para o banco de dados
 * TODO: Gerar tipos automaticamente do schema do Supabase
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'enterprise';
          credits_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
};
