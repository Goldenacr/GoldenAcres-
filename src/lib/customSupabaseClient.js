import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vcbuiawcyukotjomcmiz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYnVpYXdjeXVrb3Rqb21jbWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTczMzcsImV4cCI6MjA3NzgzMzMzN30.rWkk0gHMu9bvs8TXmKlgXuriuS3DNHPtl93g0eIms18';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
