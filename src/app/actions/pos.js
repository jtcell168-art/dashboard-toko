"use server";
import { createClient } from "@/lib/supabase/server";
import { syncStockWithImeis } from "./inventory";

// Helper to get current user info
async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role, branch_id").eq("id", user.id).maybeSingle();
    return { ...user, ...(profile || {}) };
  } catch (err) {
    console.error("Error in pos getCurrentUser:", err);
    return null;
  }
}

// Ambil produk untuk POS
export async function getPosProducts(branchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    const userRole = (user?.role || "").toLowerCase();
    const isOwner = userRole.includes("owner");
    const isManager = userRole.includes("manager");

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
      .eq("status", "stock")
      .limit(20000); // Added limit for safety

    return products.map(product => {
      let categoryName = "Uncategorized";
      if (product.categories) {
        categoryName = Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name;
      }
      
      const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"];
      const isImeiTracked = trackedCategories.some(c => categoryName?.trim().toUpperCase().includes(c));
      let filteredStock = product.stock || [];
      let productImeis = [];
 
      // Group and sum stock records by branch ID to handle potential duplicates
      const branchStockObj = {};
      filteredStock.forEach(s => {
        if (!branchStockObj[s.branch_id]) branchStockObj[s.branch_id] = { ...s, quantity: 0 };
        branchStockObj[s.branch_id].quantity += Number(s.quantity || 0);
      });
      filteredStock = Object.values(branchStockObj);

      if (isImeiTracked && imeiList) {
        const productRelatedImeis = imeiList.filter(i => i.product_id === product.id);
        
        // If branchId is specified, we should probably only show IMEIs for that branch to avoid confusion
        // But for searching purposes, we might want all of them if the user is a manager
        let searchImeis = productRelatedImeis;
        if (branchId !== "all" && !isOwner && !isManager) {
           searchImeis = productRelatedImeis.filter(i => i.branch_id === branchId);
        }
        
        productImeis = searchImeis.map(i => i.imei);

        // Calculate stock based on available IMEIs
        const branchCounts = {};
        productRelatedImeis.forEach(i => {
          branchCounts[i.branch_id] = (branchCounts[i.branch_id] || 0) + 1;
        });

        filteredStock = filteredStock.map(s => {
          const imeiCount = branchCounts[s.branch_id] || 0;
          // Source of truth: IMEIs if they exist, otherwise manual stock
          const finalQty = imeiCount > 0 ? imeiCount : Number(s.quantity || 0);
            
          return {
            ...s,
            quantity: finalQty
          };
        });

        Object.entries(branchCounts).forEach(([bId, count]) => {
          if (!filteredStock.find(s => s.branch_id === bId)) {
            filteredStock.push({ branch_id: bId, quantity: count });
          }
        });
      }

      // Filter stock row by branch
      if (branchId !== "all") {
        filteredStock = filteredStock.filter(s => s.branch_id === branchId);
      }

      const totalQty = filteredStock.reduce((sum, s) => sum + (s.quantity || 0), 0);

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: categoryName,
        sellPrice: product.retail_price,
        purchasePrice: product.purchase_price,
        totalStock: totalQty,
        is_service: product.is_service,
        is_digital: product.is_digital,
        imeis: productImeis, 
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
export async function processTransaction(cart, discountAmount, paymentMethod, customerName, branchId, userId, customerPhone = "", creditProvider = "", discountPercent = 0, installmentData = null, customerAddress = "") {
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
      customer_address: customerAddress,
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
      await supabase.from("transaction_items").insert({
        transaction_id: transaction.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.sellPrice,
        subtotal: item.sellPrice * item.qty
      });

      // Determined target branch for stock reduction
      // If branchId is 'all', we should use the transaction's branch_id (which might be the cashier's branch)
      const targetBranchId = (branchId && branchId !== "all") ? branchId : transaction.branch_id;

      if (!item.is_service && !item.is_digital && targetBranchId) {
        const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE"];
        const isImeiTracked = trackedCategories.some(c => item.category?.trim().toUpperCase().includes(c));

        // A. Handle IMEI-tracked products
        if (isImeiTracked) {
          let imeisToSold = [];
          if (item.selectedImeis && item.selectedImeis.length > 0) {
            imeisToSold = item.selectedImeis;
          } else {
            const { data: availableImeis } = await supabase
              .from("imei_records")
              .select("id, imei")
              .eq("product_id", item.id)
              .eq("branch_id", targetBranchId)
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
                  sold_at: new Date().toISOString(),
                  customer_name: customerName,
                  customer_phone: customerPhone,
                  customer_address: customerAddress
                })
                .eq("id", imei.id);
            }
          }
        }

        // B. Handle Stock table reduction (for BOTH IMEI and non-IMEI items)
        const { data: currentStock } = await supabase
          .from("stock")
          .select("quantity")
          .eq("product_id", item.id)
          .eq("branch_id", targetBranchId)
          .maybeSingle();

        const oldQty = currentStock?.quantity || 0;
        const newQty = Math.max(0, oldQty - item.qty);

        await supabase
          .from("stock")
          .upsert({
            product_id: item.id,
            branch_id: targetBranchId,
            quantity: newQty,
            updated_at: new Date().toISOString()
          }, { onConflict: 'product_id,branch_id' });

        // C. Final sync for IMEI items to be 100% sure
        if (isImeiTracked) {
          await syncStockWithImeis(supabase, item.id, targetBranchId);
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

  const sPrice = Math.round(Number(sellingPrice || 0));

  // 1. Insert Transaction
  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .insert({
      invoice_no: `DIG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "digital",
      customer_name: phoneNumber, 
      customer_phone: phoneNumber,
      branch_id: (user.role === 'owner' || user.role === 'manager') ? (branchId === "all" ? null : branchId) : (user.branch_id || (branchId === "all" ? null : branchId)),
      cashier_id: user.id,
      subtotal: sPrice,
      total: sPrice,
      payment_method: "cash", 
      status: "completed",
      notes: `${tab ? tab.toUpperCase() : 'DIGITAL'} - ${provider} - ${note}`
    })
    .select()
    .single();

  if (trxError) throw new Error(trxError.message);

  const cPrice = Math.round(Number(costPrice || 0));

  // 2. Insert into transaction_items
  const { error: itemError } = await supabase
    .from("transaction_items")
    .insert({
      transaction_id: transaction.id,
      product_name: `${provider} ${note}`,
      quantity: 1,
      unit_price: sPrice,
      purchase_price: cPrice, // Note: requires purchase_price column
      subtotal: sPrice
    });

  if (itemError) {
    console.warn("Item insert error, trying fallback:", itemError.message);
    // Fallback if purchase_price column doesn't exist yet
    const { error: fallbackError } = await supabase
      .from("transaction_items")
      .insert({
        transaction_id: transaction.id,
        product_name: `${provider} ${note}`,
        quantity: 1,
        unit_price: sPrice,
        subtotal: sPrice
      });
    
    if (fallbackError) throw new Error(fallbackError.message);
  }

  return transaction;
}

// HAPUS TRANSAKSI (Hanya Owner) — dengan audit log + restore stok
export async function deleteTransaction(transactionId) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Hanya owner yang diizinkan menghapus transaksi.");
  }

  // 1. Ambil data transaksi + items sebelum dihapus
  const { data: trx } = await supabase
    .from("transactions")
    .select("*, transaction_items(*), branches(name), profiles(full_name)")
    .eq("id", transactionId)
    .single();

  if (!trx) throw new Error("Transaksi tidak ditemukan.");

  // 2. Simpan ke deletion_logs (audit trail)
  await supabase.from("deletion_logs").insert({
    table_name: "transactions",
    record_id: transactionId,
    deleted_data: trx,
    deleted_by: authUser.id,
    deleted_by_name: profile?.full_name || "Owner",
    reason: `Hapus transaksi ${trx.invoice_no} - Total ${trx.total}`
  });

  // 3. Restore stock untuk setiap item
  const items = trx.transaction_items || [];
  for (const item of items) {
    if (!item.product_id || !trx.branch_id) continue;

    // Check if product is IMEI-tracked
    const { data: prod } = await supabase
      .from("products")
      .select("id, categories(name)")
      .eq("id", item.product_id)
      .maybeSingle();

    const catName = prod?.categories?.name?.toUpperCase() || "";
    const trackedCategories = ["HP", "HANDPHONE", "SMARTPHONE"];
    const isImeiTracked = trackedCategories.some(c => catName.includes(c));

    // 3a. Restore IMEI to 'stock' if applicable
    if (isImeiTracked) {
      await supabase
        .from("imei_records")
        .update({ status: "stock", sold_at: null, customer_name: null, customer_phone: null })
        .eq("product_id", item.product_id)
        .eq("branch_id", trx.branch_id)
        .eq("status", "sold")
        .limit(item.quantity);
    }

    // 3b. Restore stock quantity
    const { data: currentStock } = await supabase
      .from("stock")
      .select("quantity")
      .eq("product_id", item.product_id)
      .eq("branch_id", trx.branch_id)
      .maybeSingle();

    const restoredQty = (currentStock?.quantity || 0) + (item.quantity || 1);

    await supabase.from("stock").upsert({
      product_id: item.product_id,
      branch_id: trx.branch_id,
      quantity: restoredQty,
      updated_at: new Date().toISOString()
    }, { onConflict: "product_id,branch_id" });
  }

  // 4. Hapus transaksi (cascade deletes transaction_items)
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

export async function getTransactionDetail(transactionId) {
  try {
    const supabase = await createClient();
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*, profiles(full_name), branches(*), transaction_items(*)")
      .eq("id", transactionId)
      .single();

    if (error) throw error;
    return transaction;
  } catch (err) {
    console.error("Error fetching transaction detail:", err);
    return null;
  }
}
