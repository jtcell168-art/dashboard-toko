"use server";
import { createClient } from "@/lib/supabase/server";

// Ambil produk untuk POS
export async function getPosProducts(branchId = "all") {
  const supabase = await createClient();

  let query = supabase.from("products").select(`
    *,
    stock (
      branch_id,
      quantity
    )
  `);

  const { data: products, error } = await query;
  
  if (error) {
    console.error("Error fetching POS products:", error);
    return [];
  }

  // Format products so it's easy to use in POS
  return products.map(product => {
    // Hitung total stok (atau stok cabang jika branchId bukan 'all')
    const relevantStock = branchId === "all" 
      ? product.stock 
      : product.stock.filter(s => s.branch_id === branchId);
      
    const totalQty = relevantStock.reduce((sum, s) => sum + s.quantity, 0);

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      sellPrice: product.retail_price,
      purchasePrice: product.purchase_price,
      totalStock: totalQty,
      is_service: product.is_service,
      is_digital: product.is_digital,
    };
  });
}

// Proses Transaksi
export async function processTransaction(cart, discountAmount, paymentMethod, customerName, branchId, userId) {
  const supabase = await createClient();
  
  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const total = subtotal - discountAmount;
  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;

  // 1. Insert ke tabel transactions
  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .insert({
      branch_id: branchId,
      user_id: userId,
      type: "retail",
      invoice_no: invoiceNo,
      subtotal: subtotal,
      discount: discountAmount,
      total: total,
      payment_method: paymentMethod,
      customer_name: customerName,
      status: "completed"
    })
    .select()
    .single();

  if (trxError) throw new Error(trxError.message);

  // 2. Insert item-item ke transaction_items & kurangi stok
  for (const item of cart) {
    await supabase.from("transaction_items").insert({
      transaction_id: transaction.id,
      product_id: item.id,
      quantity: item.qty,
      unit_price: item.sellPrice,
      subtotal: item.sellPrice * item.qty
    });

    // Kurangi stok di branch bersangkutan (jika bukan jasa/digital)
    if (!item.is_service && !item.is_digital) {
      // Cari baris stok
      const { data: stockRow } = await supabase
        .from("stock")
        .select("*")
        .eq("product_id", item.id)
        .eq("branch_id", branchId)
        .single();
        
      if (stockRow) {
        await supabase
          .from("stock")
          .update({ quantity: stockRow.quantity - item.qty })
          .eq("id", stockRow.id);
      }
    }
  }

  return transaction;
}
