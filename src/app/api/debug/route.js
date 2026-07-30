import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');

  if (imei) {
    const { data } = await supabase
      .from('imei_records')
      .select('*, products(name, id), branches(name)')
      .eq('imei', imei)
      .maybeSingle();
    return NextResponse.json(data);
  }

  // Get all products matching VIVO Y05
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku')
    .ilike('name', '%Y05%');

  return NextResponse.json(products);
}
