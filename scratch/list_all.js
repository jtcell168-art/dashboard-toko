
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
  console.log('--- LISTING PRODUCTS ---');
  const { data: products } = await supabase.from('products').select('name, sku').limit(50);
  if (!products || products.length === 0) {
    console.log('NO PRODUCTS FOUND IN DATABASE.');
  } else {
    products.forEach(p => console.log(`- ${p.name} (SKU: ${p.sku})`));
  }

  console.log('\n--- SEARCHING FOR TARGET IMEIS ---');
  const targetImeis = ['863240088146285', '863240088495864', '863240088354186'];
  for (const imei of targetImeis) {
    const { data: record } = await supabase.from('imei_records').select('*, branches(name)').eq('imei', imei).maybeSingle();
    if (record) {
      console.log(`IMEI ${imei} FOUND: Status=${record.status}, Branch=${record.branches?.name}`);
    } else {
      console.log(`IMEI ${imei} NOT FOUND.`);
    }
  }
}

listAll();
