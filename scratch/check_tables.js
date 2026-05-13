
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyadzrfnovugcinlssup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWR6cmZub3Z1Z2Npbmxzc3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTM4NTMsImV4cCI6MjA5MjkyOTg1M30.DPrWL2g8Wnp2n7oyX4809kPjWvMsgPQjRJFAEpSEbzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('--- CHECKING TABLES IN THIS DATABASE ---');
  
  // Query to get table names from information_schema
  const { data, error } = await supabase
    .rpc('get_tables'); // Hope this RPC exists, if not we try another way
  
  if (error) {
    // If RPC fails, try a direct query to a known table to see if it even exists
    console.log('Directly checking "transactions" table existence...');
    const { count, error: tError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (tError) {
      console.log(`Table "transactions" NOT FOUND. Error: ${tError.message}`);
    } else {
      console.log(`Table "transactions" FOUND! Count: ${count}`);
    }
    
    const { count: pCount, error: pError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
      
    if (pError) {
      console.log(`Table "products" NOT FOUND.`);
    } else {
      console.log(`Table "products" FOUND! Count: ${pCount}`);
    }
  } else {
    console.log('Tables:', data);
  }
}

checkTables();
