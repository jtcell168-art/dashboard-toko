const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStock() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      name, sku,
      stock (
        quantity,
        branches ( name )
      )
    `)
    .eq('sku', 'D-A3');
  
  if (error) {
    console.error(error);
    return;
  }
  console.log('Stock for D-A3:', JSON.stringify(data, null, 2));
}

checkStock();
