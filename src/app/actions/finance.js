"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { getTotalSalaries } from "./salaries";

// GET EXPENSES
export async function getExpenses(startDate, endDate) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase.from("expenses").select("*, branches (name)").order("date", { ascending: false });
  
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate + "T23:59:59");

  if (user.role === "manager" && user.branch_id) {
    query = query.eq("branch_id", user.branch_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
  return data;
}

// ADD EXPENSE
export async function addExpense(expenseData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      branch_id: expenseData.branchId,
      category: expenseData.category,
      amount: expenseData.amount,
      note: expenseData.note,
      date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// UPDATE EXPENSE
export async function updateExpense(id, expenseData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      category: expenseData.category,
      amount: expenseData.amount,
      note: expenseData.note
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}

// DELETE EXPENSE
export async function deleteExpense(id) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// KASBON ACTIONS
export async function getKasbon() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kasbon")
    .select("*, profiles:employee_id(full_name, role)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addKasbon(kasbonData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kasbon")
    .insert({
      employee_id: kasbonData.profile_id,
      amount: Number(kasbonData.amount),
      remaining: Number(kasbonData.amount),
      installment_amount: Number(kasbonData.installment_amount),
      reason: kasbonData.reason,
      status: "pending_approval"
    });
  if (error) throw error;
  return true;
}

export async function approveKasbon(id) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kasbon")
    .update({ status: "active" })
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function payKasbon(id, amount, note = "") {
  const supabase = await createClient();
  
  const { data: current } = await supabase
    .from("kasbon")
    .select("remaining, amount")
    .eq("id", id)
    .single();
  
  if (!current) throw new Error("Kasbon not found");

  const newRemaining = Math.max(0, Number(current.remaining) - Number(amount));
  const newStatus = newRemaining === 0 ? "paid" : "active";

  const { error: upError } = await supabase
    .from("kasbon")
    .update({ 
      remaining: newRemaining,
      status: newStatus
    })
    .eq("id", id);
  
  if (upError) throw upError;
  return true;
}

// INSTALLMENT ACTIONS
export async function getInstallments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("installments")
    .select("*, transactions(invoice_no)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addInstallment(data) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("installments")
    .insert(data);
  if (error) throw error;
  return true;
}

// GET PNL DATA
export async function getPnlData(selectedBranchId = "all", customStart, customEnd) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return [];

    const { data: user } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    if (!user) return [];

    const isOwner = user.role === "owner";
    const userBranchId = user.branch_id;
    let targetBranchId = isOwner ? (selectedBranchId === "all" ? null : selectedBranchId) : userBranchId;

    const results = [];

    // Jika ada filter tanggal kustom
    if (customStart && customEnd) {
      let current = new Date(customStart);
      const end = new Date(customEnd);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const displayDate = current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        // Gunakan format yang sama dengan dashboard.js
        const dayStart = dateStr;
        const dayEnd = dateStr + "T23:59:59";

        // Ambil ID transaksi yang completed di hari tersebut
        let txQuery = supabase
          .from("transactions")
          .select("id")
          .eq("status", "completed")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        
        if (targetBranchId) txQuery = txQuery.eq("branch_id", targetBranchId);
        const { data: txs } = await txQuery;
        const txIds = (txs || []).map(t => t.id);

        let revenue = 0, cogs = 0;
        if (txIds.length > 0) {
          const { data: items } = await supabase
            .from("transaction_items")
            .select("subtotal, purchase_price, quantity, products(purchase_price)")
            .in("transaction_id", txIds);

          (items || []).forEach(item => {
            revenue += Number(item.subtotal);
            let pPrice = (item.purchase_price && Number(item.purchase_price) > 0) ? Number(item.purchase_price) : (item.products?.purchase_price || 0);
            cogs += pPrice * (item.quantity || 1);
          });
        }

        // Expenses & Salaries
        let expQuery = supabase.from("expenses").select("amount").eq("date", dateStr);
        if (targetBranchId) expQuery = expQuery.eq("branch_id", targetBranchId);
        const { data: expensesList } = await expQuery;
        const expenses = (expensesList || []).reduce((sum, e) => sum + Number(e.amount), 0);

        let salaries = 0;
        try { if (user.role === "owner") salaries = await getTotalSalaries(dayStart, dayEnd); } catch(e) {}

        results.push({
          label: displayDate,
          revenue,
          cogs,
          expenses: expenses + salaries,
          profit: revenue - cogs - (expenses + salaries)
        });

        current.setDate(current.getDate() + 1);
      }
    } else {
      // Default: 6 Bulan Terakhir
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const startStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
        const endStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}T23:59:59`;

        // Ambil ID transaksi yang completed di bulan tersebut
        let txQuery = supabase
          .from("transactions")
          .select("id")
          .eq("status", "completed")
          .gte("created_at", startStr)
          .lte("created_at", endStr);
        
        if (targetBranchId) txQuery = txQuery.eq("branch_id", targetBranchId);
        const { data: txs } = await txQuery;
        const txIds = (txs || []).map(t => t.id);

        let revenue = 0, cogs = 0;
        if (txIds.length > 0) {
          const { data: items } = await supabase
            .from("transaction_items")
            .select("subtotal, purchase_price, quantity, products(purchase_price)")
            .in("transaction_id", txIds);

          (items || []).forEach(item => {
            revenue += Number(item.subtotal);
            let pPrice = (item.purchase_price && Number(item.purchase_price) > 0) ? Number(item.purchase_price) : (item.products?.purchase_price || 0);
            cogs += pPrice * (item.quantity || 1);
          });
        }

        let expQuery = supabase.from("expenses").select("amount")
          .gte("date", startStr)
          .lte("date", endStr.split('T')[0]);
        if (targetBranchId) expQuery = expQuery.eq("branch_id", targetBranchId);
        const { data: expensesList } = await expQuery;
        const expenses = (expensesList || []).reduce((sum, e) => sum + Number(e.amount), 0);

        let salaries = 0;
        try { if (user.role === "owner") salaries = await getTotalSalaries(startStr, endStr); } catch(e) {}

        results.push({
          label,
          revenue,
          cogs,
          expenses: expenses + salaries,
          profit: revenue - cogs - (expenses + salaries)
        });
      }
    }

    return results;
  } catch (err) {
    console.error("PnL calculation error:", err);
    return [];
  }
}
