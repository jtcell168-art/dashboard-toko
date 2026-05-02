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

  // Jika manager cabang, hanya ambil data cabangnya
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

// GET PNL DATA (Monthly Trend)
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

    // Loop for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleString('id-ID', { month: 'long' });
      const year = d.getFullYear();
      
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      // 1. Revenue & COGS from transactions
      let itemsQuery = supabase
        .from("transaction_items")
        .select(`
          quantity,
          subtotal,
          products (purchase_price)
        `)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");
        
      if (targetBranchId) {
        // We need to join with transactions to filter by branch
        itemsQuery = supabase
          .from("transaction_items")
          .select(`
            quantity,
            subtotal,
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
        const pPrice = item.products?.purchase_price || 0;
        cogs += pPrice * item.quantity;
      });

      // 2. Expenses
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

      // 3. Salaries (only if owner or manager)
      // Note: salaries table doesn't have branch_id currently, so it's a global expense for owners
      // or we skip it for branch managers if not applicable.
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
