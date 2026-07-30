const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  console.log('--- INSPECTION START ---');
  
  const imeis = ['869877081319650', '869877080559934'];
  
  for (const imei of imeis) {
    console.log(`\nSearching for IMEI ${imei}...`);
    const { data: imeiRecord, error: imeiError } = await supabase
      .from('imei_records')
      .select('*, products(*)')
      .eq('imei', imei)
      .maybeSingle();
    
    if (imeiError) console.error('IMEI Error:', imeiError);
    if (imeiRecord) {
      console.log('IMEI Record Found:');
      console.log(JSON.stringify(imeiRecord, null, 2));
    } else {
      console.log('IMEI Record NOT FOUND with exact match.');
    }
  }

  console.log('\n--- INSPECTION END ---');
}

inspectData();
