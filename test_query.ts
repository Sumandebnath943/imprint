import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const vars = Object.fromEntries(env.split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1).replace(/^"|"$/g, '').trim()]; }));

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .not('response_file_url', 'is', null)
    .limit(1);
    
  console.log('Test query result:', error ? 'ERROR: ' + error.message : 'SUCCESS!');
}

check();
