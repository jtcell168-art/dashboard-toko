
const { createClient } = require('@supabase/supabase-js');

// Hardcoded to bypass .env issues
const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLast5() {
  console.log('--- LISTING LAST 5 TRANSACTIONS ---');
  const { data, error } = await supabase
    .from('transactions')
    .select('invoice_no, customer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No transactions found at all.');
    return;
  }

  data.forEach(t => console.log(`- ${t.invoice_no} | ${t.customer_name} | ${t.created_at}`));
}

checkLast5();
