const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function manageCategories() {
  // 1. Check existing
  const { data: existing } = await supabase.from('categories').select('*');
  console.log('Current categories:', existing);

  // 2. Add Kartu Perdana
  const { error } = await supabase.from('categories').insert([
    { name: 'Kartu Perdana', type: 'Aksesori' }
  ]);

  if (error) {
    console.error('Error adding category:', error);
  } else {
    console.log('Successfully added Kartu Perdana');
  }
}

manageCategories();
