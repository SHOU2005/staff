import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jwxkxhdtebazwkazywbk.supabase.co', 'sb_publishable_5cqgFN--6Cn0bPGcbH8gSQ_zRX0ufSo');

async function createShourya() {
  const { data, error } = await supabase.from('app_users').insert({
    name: 'Shourya Pandey',
    phone: '9000000000',
    password: btoa(encodeURIComponent('shourya123')),
    role: 'captain',
    captainId: 'captain_shourya_001',
    active: true
  }).select();
  console.log('Result:', error || data);
}
createShourya();
