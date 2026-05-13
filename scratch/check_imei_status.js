
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

const imeis = ['863240088146285', '863240088495864', '863240088354186'];

async function checkImeis() {
  const { data: imeiData, error: imeiError } = await supabase
    .from('imei_records')
    .select('*, branches(name), products(name)')
    .in('imei', imeis);

  if (imeiError) {
    console.error('Error fetching IMEI data:', imeiError);
    return;
  }

  console.log('IMEI Records:');
  console.log(JSON.stringify(imeiData, null, 2));

  // Also check stock_transfers for these IMEIs
  // Note: stock_transfers doesn't have an imei column in the schema I saw.
  // Wait, let's re-examine the schema for transfers.
  // The schema shows stock_transfers only has product_id and quantity.
  // How are IMEI transfers handled?
}

checkImeis();
