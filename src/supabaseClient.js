import { createClient } from "@supabase/supabase-js";

// Preencha essas duas variáveis no arquivo .env (veja .env.example)
// depois de criar seu projeto gratuito em https://supabase.com
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env — veja o README."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
