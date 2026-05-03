import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const vars = Object.fromEntries(env.split('\n').filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1).replace(/^"|"$/g, '').trim()]; }));
const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get a sample profile to see what's stored
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, age_group, profession, profession_cluster, ai_exposure_level, onboarding_completed, onboarding_step')
    .limit(5);
  console.log('Profiles:', JSON.stringify(data, null, 2));
  console.log('Error:', error?.message);
}
check();
