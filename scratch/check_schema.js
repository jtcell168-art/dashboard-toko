const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: st, error: e1 } = await supabase.from('stock_transfers').select('*').limit(1);
  console.log('stock_transfers fields:', st ? Object.keys(st[0] || {}) : e1);
  const { data: ir, error: e2 } = await supabase.from('imei_records').select('*').limit(1);
  console.log('imei_records fields:', ir ? Object.keys(ir[0] || {}) : e2);
}
check();
