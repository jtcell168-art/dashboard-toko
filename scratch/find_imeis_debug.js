
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findImeis() {
  console.log('Searching for IMEIs with flexible match...');
  
  const searchTerms = ['863240088146285', '863240088495864', '863240088354186'];
  
  for (const s of searchTerms) {
    const { data, error } = await supabase
      .from('imei_records')
      .select('*')
      .ilike('imei', `%${s.trim()}%`);
    
    if (error) console.error('Error:', error);
    if (data && data.length > 0) {
      console.log(`Found for ${s}:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`No match for ${s}`);
    }
  }

  console.log('\nListing last 5 IMEIs in database:');
  const { data: lastImeis } = await supabase
    .from('imei_records')
    .select('imei')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log(JSON.stringify(lastImeis, null, 2));
}

findImeis();
