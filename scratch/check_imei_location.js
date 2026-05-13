
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImei() {
  const targetImei = '863240088495864';
  console.log(`Checking IMEI: ${targetImei}`);

  const { data, error } = await supabase
    .from('imei_records')
    .select('*, branches(name), products(name)')
    .eq('imei', targetImei)
    .maybeSingle();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data) {
    console.log('IMEI not found.');
    return;
  }

  console.log(`FOUND!`);
  console.log(`- Product: ${data.products?.name}`);
  console.log(`- Branch: ${data.branches?.name} (ID: ${data.branch_id})`);
  console.log(`- Status: ${data.status}`);
}

checkImei();
