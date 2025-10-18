import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfaojjaxbqdjhmmqbbtu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW9qamF4YnFkamhtbXFiYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzQ1NTgsImV4cCI6MjA3NjMxMDU1OH0.F0NHpi0wxJ0Jf8jNmBLQJg4ueEHcDfj23M4rlZNhT_M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
