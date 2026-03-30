import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://danhczdxnsrfyhudjdcu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbmhjemR4bnNyZnlodWRqZGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk3OTcsImV4cCI6MjA5MDA4NTc5N30.SHpaqfEB1IXyNw6bwdMoBMhuUTqGIQ9FWQQ4FYZn5A0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
