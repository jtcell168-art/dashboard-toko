"use server";
import { createClient } from "@/lib/supabase/server";

// Helper to get current user info
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, branch_id").eq("id", user.id).single();
  return { ...user, ...profile };
}

// Ambil produk untuk POS
export async function getPosProducts(branchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Fetch products with stock and categories
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        categories ( name ),
        stock (
          branch_id,
          quantity
        )
      `)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching POS products:", error);
      return [];
    }

    // 2. Fetch IMEIs for HP products (status 'stock')
    const { data: imeiList } = await supabase
      .from("imei_records")
      .select("product_id, branch_id, imei")
      .eq("status", "stock");

    return products.map(product => {
      const isHP = product.categories?.name === "HP";
      let filteredStock = product.stock || [];
      let productImeis = [];

      if (isHP && imeiList) {
        const productRelatedImeis = imeiList.filter(i => i.product_id === product.id);
        
        // Filter IMEIs by branch if needed
        let branchFilteredImeis = productRelatedImeis;
        if (branchId !== "all" && user?.role !== "owner" && user?.role !== "manager") {
          branchFilteredImeis = productRelatedImeis.filter(i => i.branch_id === branchId);
        } else if (branchId !== "all") {
           // If owner/manager selected a specific branch
           branchFilteredImeis = productRelatedImeis.filter(i => i.branch_id === branchId);
        }
        
        productImeis = branchFilteredImeis.map(i => i.imei);

        // Calculate stock based on available IMEIs
        const branchCounts = {};
        branchFilteredImeis.forEach(i => {
          branchCounts[i.branch_id] = (branchCounts[i.branch_id] || 0) + 1;
        });
        
        // Map back to stock structure
        filteredStock = filteredStock.map(s => ({
          ...s,
          quantity: branchCounts[s.branch_id] || 0
        }));

        Object.entries(branchCounts).forEach(([bId, count]) => {
          if (!filteredStock.find(s => s.branch_id === bId)) {
            filteredStock.push({ branch_id: bId, quantity: count });
          }
        });
      }

      // Filter stock row by branch for non-owner/manager
      if (branchId !== "all" && user?.role !== "owner" && user?.role !== "manager") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      } else if (branchId !== "all") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      }

      const totalQty = filteredStock.reduce((sum, s) => sum + (s.quantity || 0), 0);

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.categories?.name || "Uncategorized",
        sellPrice: product.retail_price,
        purchasePrice: product.purchase_price,
        totalStock: totalQty,
        is_service: product.is_service,
        is_digital: product.is_digital,
        imeis: productImeis, // New field for searching
      };
    });
  } catch (err) {
    console.error("Critical error in getPosProducts:", err);
    return [];
  }
}

// Ambil list IMEI yang tersedia untuk produk tertentu
export async function getAvailableImeis(productId, branchId) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("imei_records")
      .select("id, imei")
      .eq("product_id", productId)
      .eq("status", "stock");

    if (branchId && branchId !== "all") {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching available IMEIs:", err);
    return [];
  }
}

// Proses Transaksi
export async function processTransaction(cart, discountAmount, paymentMethod, customerName, branchId, userId, customerPhone = "", creditProvider = "", discountPercent = 0, installmentData = null) {
  const supabase = await createClient();
  
  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const total = subtotal - discountAmount;

  // 1. Insert Transaction
  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .insert({
      invoice_no: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "retail",
      customer_name: customerName,
      customer_phone: customerPhone,
      branch_id: branchId === "all" ? null : branchId,
      cashier_id: userId,
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
      total: total,
      payment_method: paymentMethod, 
      status: "completed",
      notes: paymentMethod === 'card' && creditProvider ? `Credit Provider: ${creditProvider}` : (paymentMethod === 'installment' ? 'Internal Installment' : null)
    })
    .select()
    .single();

  if (trxError) throw new Error(trxError.message);

  // 1a. If installment, create installment record
  if (paymentMethod === "installment" && installmentData) {
    const { error: insError } = await supabase
      .from("installments")
      .insert({
        transaction_id: transaction.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: total,
        down_payment: Number(installmentData.downPayment || 0),
        remaining_amount: total - Number(installmentData.downPayment || 0),
        interest_rate: Number(installmentData.interestRate || 0),
        tenor_months: Number(installmentData.tenor || 3),
        status: "active",
        due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      });
    
    if (insError) throw new Error("Gagal mencatat data cicilan: " + insError.message);
  }

  // 2. Insert item-item ke transaction_items & kurangi stok
  for (const item of cart) {
    const { data: itemData } = await supabase.from("transaction_items").insert({
      transaction_id: transaction.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.qty,
      unit_price: item.sellPrice,
      subtotal: item.sellPrice * item.qty
    }).select().single();

    if (!item.is_service && !item.is_digital && branchId && branchId !== "all") {
      if (item.category === "HP") {
        let imeisToSold = [];
        if (item.selectedImeis && item.selectedImeis.length > 0) {
          imeisToSold = item.selectedImeis;
        } else {
          const { data: availableImeis } = await supabase
            .from("imei_records")
            .select("id, imei")
            .eq("product_id", item.id)
            .eq("branch_id", branchId)
            .eq("status", "stock")
            .order("created_at", { ascending: true })
            .limit(item.qty);
          imeisToSold = availableImeis || [];
        }

        if (imeisToSold.length > 0) {
          for (const imei of imeisToSold) {
            await supabase
              .from("imei_records")
              .update({ 
                status: "sold", 
                sold_at: new Date().toISOString()
              })
              .eq("id", imei.id);
          }
        }
      }

      const { data: stockRow } = await supabase
        .from("stock")
        .select("*")
        .eq("product_id", item.id)
        .eq("branch_id", branchId)
        .maybeSingle();
        
      if (stockRow) {
        await supabase
          .from("stock")
          .update({ quantity: Math.max(0, (stockRow.quantity || 0) - item.qty) })
          .eq("id", stockRow.id);
      }
    }
  }

  return transaction;
}

// Proses Transaksi Produk Digital
export async function processDigitalTransaction(data) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { phoneNumber, provider, note, costPrice, sellingPrice, branchId, tab } = data;

  // 1. Insert Transaction
  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .insert({
      invoice_no: `DIG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "digital",
      customer_name: phoneNumber, // Use phone as customer name if not provided
      customer_phone: phoneNumber,
      branch_id: branchId === "all" ? null : branchId,
      cashier_id: user.id,
      subtotal: Number(sellingPrice),
      total: Number(sellingPrice),
      payment_method: "cash", // Default to cash for digital
      status: "completed",
      notes: `${tab.toUpperCase()} - ${provider} - ${note}`
    })
    .select()
    .single();

  if (trxError) throw new Error(trxError.message);

  // 2. Insert into transaction_items
  const { error: itemError } = await supabase
    .from("transaction_items")
    .insert({
      transaction_id: transaction.id,
      product_name: `${provider} ${note}`,
      quantity: 1,
      unit_price: Number(sellingPrice),
      purchase_price: Number(costPrice || 0), // Note: requires purchase_price column
      subtotal: Number(sellingPrice)
    });

  if (itemError) {
    console.warn("Item inserted but purchase_price might have failed if column doesn't exist:", itemError.message);
    // Fallback if column doesn't exist yet: retry without purchase_price
    if (itemError.message.includes('purchase_price')) {
      await supabase
        .from("transaction_items")
        .insert({
          transaction_id: transaction.id,
          product_name: `${provider} ${note}`,
          quantity: 1,
          unit_price: Number(sellingPrice),
          subtotal: Number(sellingPrice)
        });
    } else {
      throw new Error(itemError.message);
    }
  }

  return transaction;
}

// HAPUS TRANSAKSI (Hanya Owner)
export async function deleteTransaction(transactionId) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Hanya owner yang diizinkan menghapus transaksi.");
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) throw new Error(error.message);
  return true;
}

// FIX: Sinkronisasi stok Nokia yang terlanjur terjual
export async function fixNokiaStock(branchId) {
  const supabase = await createClient();
  
  // 1. Cari produk Nokia 105
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .ilike("name", "%Nokia 105%");
    
  if (!products || products.length === 0) return "Produk Nokia 105 tidak ditemukan";
  const productId = products[0].id;

  // 2. Resolve branchId jika "all"
  let targetBranchId = branchId;
  if (branchId === "all") {
    const { data: laraBranch } = await supabase
      .from("branches")
      .select("id")
      .ilike("name", "%Larantuka%")
      .single();
    if (laraBranch) targetBranchId = laraBranch.id;
    else return "Cabang Larantuka tidak ditemukan";
  }

  // 3. Ambil 3 IMEI tertua yang masih 'available' di cabang tersebut
  const { data: availableImeis } = await supabase
    .from("imei_records")
    .select("id")
    .eq("product_id", productId)
    .eq("branch_id", targetBranchId)
    .eq("status", "stock")
    .order("created_at", { ascending: true })
    .limit(3);

  if (!availableImeis || availableImeis.length === 0) {
    return `Tidak ada IMEI 'available' untuk dikurangi di cabang ini.`;
  }

  const countToFix = availableImeis.length;

  // 4. Mark as sold
  for (const imei of availableImeis) {
    await supabase
      .from("imei_records")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", imei.id);
  }

  // 5. Update stock table as well
  const { data: stockRow } = await supabase
    .from("stock")
    .select("id, quantity")
    .eq("product_id", productId)
    .eq("branch_id", targetBranchId)
    .maybeSingle();

  if (stockRow) {
    await supabase
      .from("stock")
      .update({ quantity: Math.max(0, (stockRow.quantity || 0) - countToFix) })
      .eq("id", stockRow.id);
  }

  return `Berhasil mensinkronkan ${countToFix} unit Nokia di cabang Larantuka.`;
}

export async function migrateImeiStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imei_records")
    .update({ status: "stock" })
    .eq("status", "available");
  
  if (error) return "Gagal migrasi: " + error.message;
  return "Berhasil migrasi status IMEI.";
}
