"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

// GET EXPENSES
export async function getExpenses() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase.from("expenses").select("*, branches (name)").order("date", { ascending: false });
  
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
