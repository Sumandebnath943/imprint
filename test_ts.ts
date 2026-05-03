import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
const query = supabase.from('journal_entries').select('*').not('response_file_url', 'is', null);
