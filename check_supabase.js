import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://jwxkxhdtebazwkazywbk.supabase.co', 'sb_publishable_5cqgFN--6Cn0bPGcbH8gSQ_zRX0ufSo');

async function check() {
  const { data, error } = await supabase.from('candidates').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  }
}
check();
