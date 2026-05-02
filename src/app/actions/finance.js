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
    .select("*, profiles(full_name, role)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addKasbon(kasbonData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kasbon")
    .insert({
      profile_id: kasbonData.profile_id,
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
export async function getPnlData(selectedBranchId = "all") {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user) return [];

    const isOwner = user.role === "owner";
    const userBranchId = user.branch_id;
    let targetBranchId = isOwner ? (selectedBranchId === "all" ? null : selectedBranchId) : userBranchId;

    const now = new Date();
    const results = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleString('id-ID', { month: 'long' });
      const year = d.getFullYear();
      
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      let itemsQuery = supabase
        .from("transaction_items")
        .select(`
          quantity,
          subtotal,
          purchase_price,
          products (purchase_price)
        `)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");
        
      if (targetBranchId) {
        itemsQuery = supabase
          .from("transaction_items")
          .select(`
            quantity,
            subtotal,
            purchase_price,
            transactions!inner(branch_id),
            products (purchase_price)
          `)
          .eq("transactions.branch_id", targetBranchId)
          .gte("created_at", startDate)
          .lte("created_at", endDate + "T23:59:59");
      }

      const { data: items } = await itemsQuery;

      let revenue = 0;
      let cogs = 0;
      (items || []).forEach(item => {
        revenue += Number(item.subtotal);
        // Prioritize purchase_price in transaction_items (for digital/manual)
        // fallback to products.purchase_price (for retail)
        const pPrice = item.purchase_price !== undefined && item.purchase_price !== null 
          ? Number(item.purchase_price) 
          : (item.products?.purchase_price || 0);
        cogs += pPrice * item.quantity;
      });

      let expQuery = supabase
        .from("expenses")
        .select("amount")
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (targetBranchId) {
        expQuery = expQuery.eq("branch_id", targetBranchId);
      }
      const { data: expensesList } = await expQuery;
      const expenses = (expensesList || []).reduce((sum, e) => sum + Number(e.amount), 0);

      let salaries = 0;
      if (user.role === "owner") {
        salaries = await getTotalSalaries(startDate, endDate);
      }

      const totalExpenses = expenses + salaries;
      const profit = revenue - cogs - totalExpenses;

      results.push({
        month,
        year,
        revenue,
        cogs,
        expenses: totalExpenses,
        profit
      });
    }

    return results;
  } catch (err) {
    console.error("PnL calculation error:", err);
    return [];
  }
}
