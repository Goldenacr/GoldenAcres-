import { createClient } from '@supabase/supabase-js';

// These variables are placeholders. The user will need to connect their Supabase account
// through the Hostinger Horizons integration panel to get real credentials.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;