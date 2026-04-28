"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

export async function getPurchaseOrderData() {
    const supabase = await createClient();
    const [suppliers, branches, products] = await Promise.all([
        supabase.from("suppliers").select("*").eq("is_active", true),
        supabase.from("branches").select("*").eq("is_active", true),
        supabase.from("products").select("*").eq("is_active", true),
    ]);
    return {
        suppliers: suppliers.data || [],
        branches: branches.data || [],
        products: products.data || [],
    };
}

export async function createPurchaseOrder(poData, items) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized: Hanya Owner atau Manager yang bisa membuat PO.");
  }

  // 1. Generate PO Number
  const poNumber = `PO-${Date.now()}`;
  
  // 2. Insert PO
  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: poNumber,
      supplier_id: poData.supplier_id,
      branch_id: poData.branch_id,
      total_amount: poData.total_amount,
      notes: poData.notes,
      created_by: user?.id,
      status: 'sent'
    })
    .select()
    .single();

  if (poError) throw new Error(poError.message);

  // 3. Insert Items
  const itemInserts = items.map(item => ({
    po_id: po.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price
  }));

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(itemInserts);
  if (itemsError) throw new Error(itemsError.message);

  return po;
}
