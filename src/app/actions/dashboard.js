"use server";
import { createClient } from "@/lib/supabase/server";
import { getTotalSalaries } from "./salaries";

export async function getDashboardData(startDate, endDate, selectedBranchId = "all") {
  try {
    const supabase = await createClient();

    // Get current user profile for filtering
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return {
        kpi: { revenue: 0, users: 0, products: 0, activeServices: { pending: 0, process: 0, done: 0 } },
        recentTransactions: [],
        sales7Days: [],
        revenueByBranch: [],
        serviceAlerts: [],
      };
    }

    const { data: profile } = await supabase.from("profiles").select("role, branch_id").eq("id", authUser.id).single();
    
    const isOwner = profile?.role === "owner";
    const isTeknisi = profile?.role === "teknisi";
    const userBranchId = profile?.branch_id;
    
    // Final branch filter logic: 
    // - If owner and 'all' -> no filter
    // - If teknisi -> no filter (can see service across all branches as requested)
    // - Else (manager/kasir) -> filter by their userBranchId
    let targetBranchId = (isOwner || isTeknisi) ? (selectedBranchId === "all" ? null : selectedBranchId) : userBranchId;

    // 1. Get total users
    const usersQuery = supabase.from("profiles").select("*", { count: "exact", head: true });
    if (targetBranchId) usersQuery.eq("branch_id", targetBranchId);
    const { count: usersCount } = await usersQuery;

    // 2. Get total products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // 3. Get recent transactions
    const transactionsQuery = supabase
      .from("transactions")
      .select(`
        id, invoice_no, type, total, status, created_at, payment_method, branch_id,
        profiles (full_name),
        branches (name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (isTeknisi) transactionsQuery.eq("type", "service");
    if (targetBranchId) transactionsQuery.eq("branch_id", targetBranchId);
    if (startDate) transactionsQuery.gte("created_at", startDate);
    if (endDate) transactionsQuery.lte("created_at", endDate + "T23:59:59");
    const { data: recentTransactions } = await transactionsQuery;

    // 4. Get total revenue (completed transactions)
    const revenueQuery = supabase
      .from("transactions")
      .select("total")
      .eq("status", "completed");
    
    if (isTeknisi) revenueQuery.eq("type", "service");
    if (targetBranchId) revenueQuery.eq("branch_id", targetBranchId);
    if (startDate) revenueQuery.gte("created_at", startDate);
    if (endDate) revenueQuery.lte("created_at", endDate + "T23:59:59");
    const { data: revenues } = await revenueQuery;

    const totalRevenue = revenues?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

    // 5. Active services
    const servicesQuery = supabase
      .from("service_tickets")
      .select("status");
    
    if (targetBranchId) servicesQuery.eq("branch_id", targetBranchId);
    if (startDate) servicesQuery.gte("created_at", startDate);
    if (endDate) servicesQuery.lte("created_at", endDate + "T23:59:59");
    const { data: activeServicesList } = await servicesQuery;

    const activeServices = {
      pending: activeServicesList?.filter(s => s.status === "pending").length || 0,
      process: activeServicesList?.filter(s => s.status === "process").length || 0,
      done: activeServicesList?.filter(s => s.status === "done").length || 0,
    };

    // 6. Service Alerts
    const alertsQuery = supabase
      .from("service_tickets")
      .select("id, customer_name, device_name, issue_description, status, created_at, profiles(full_name)")
      .in("status", ["pending", "overdue"])
      .order("created_at", { ascending: true })
      .limit(5);
    
    if (targetBranchId) alertsQuery.eq("branch_id", targetBranchId);
    if (startDate) alertsQuery.gte("created_at", startDate);
    if (endDate) alertsQuery.lte("created_at", endDate + "T23:59:59");
    const { data: serviceAlerts } = await alertsQuery;

    // 7. Get Total Salaries (Manager/Owner only)
    let totalSalary = 0;
    if (profile?.role === "owner" || profile?.role === "manager") {
      totalSalary = await getTotalSalaries(startDate, endDate);
    }

    const mappedAlerts = (serviceAlerts || []).map(s => ({
      id: s.id,
      customer: s.customer_name,
      device: s.device_name,
      issue: s.issue_description,
      status: s.status,
      days: Math.floor((new Date() - new Date(s.created_at)) / (1000 * 60 * 60 * 24)),
      technician: s.profiles?.full_name || null
    }));

    // 8. Calculate Sales 7 Days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesHistoryQuery = supabase
      .from("transactions")
      .select("total, created_at")
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo.toISOString());
    
    if (isTeknisi) salesHistoryQuery.eq("type", "service");
    if (targetBranchId) salesHistoryQuery.eq("branch_id", targetBranchId);
    const { data: last7DaysTrx } = await salesHistoryQuery;
    
    const sales7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("id-ID", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];
      
      const dayTotal = (last7DaysTrx || [])
        .filter(t => t.created_at.startsWith(dateStr))
        .reduce((sum, t) => sum + Number(t.total), 0);
      
      sales7Days.push({ day: dayStr, total: dayTotal });
    }

    // 9. Calculate Inventory Value (Owner only)
    let inventoryValue = 0;
    if (isOwner) {
      let invQuery = supabase
        .from("stock")
        .select(`
          quantity,
          products ( purchase_price )
        `);
      if (targetBranchId) invQuery.eq("branch_id", targetBranchId);
      
      const { data: stockData } = await invQuery;
      
      if (stockData) {
        inventoryValue = stockData.reduce((sum, s) => {
          const price = Number(s.products?.purchase_price || 0);
          return sum + (s.quantity * price);
        }, 0);
      }
    }

    // 10. Revenue by Branch
    const branchRevenueQuery = supabase
      .from("transactions")
      .select(`
        total, 
        branch_id, 
        branches(name),
        profiles:cashier_id(branch_id, branches(name))
      `)
      .eq("status", "completed")
      .gte("created_at", startDate || new Date().toISOString().split("T")[0]);
    
    if (isTeknisi) branchRevenueQuery.eq("type", "service");
    if (targetBranchId) branchRevenueQuery.eq("branch_id", targetBranchId);
    const { data: branchRevenueData } = await branchRevenueQuery;
    
    const branchMap = {};
    (branchRevenueData || []).forEach(t => {
      let bName = t.branches?.name;
      if (!bName && t.profiles?.branches?.name) {
        bName = t.profiles.branches.name;
      }
      if (!bName) {
        if (t.branch_id === "c" || t.profiles?.branch_id === "c") bName = "JT CELL RIUNG";
        else if (t.branch_id === "b" || t.profiles?.branch_id === "b") bName = "JT CELL LARANTUKA";
        else if (t.branch_id === "a" || t.profiles?.branch_id === "a") bName = "JT CELL RUTENG";
        else bName = "Tanpa Cabang";
      }
      branchMap[bName] = (branchMap[bName] || 0) + Number(t.total);
    });
    
    const revenueByBranch = Object.entries(branchMap).map(([name, rev], i) => ({
      branch: name,
      revenue: rev,
      color: ["#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"][i % 5]
    }));

    // 11. My Personal Kasbon (for any role)
    const { data: myKasbonData } = await supabase
      .from("kasbon")
      .select("remaining")
      .eq("employee_id", authUser.id)
      .eq("status", "active");
    
    const myKasbonBalance = myKasbonData?.reduce((sum, k) => sum + Number(k.remaining), 0) || 0;

    return {
      kpi: {
        revenue: totalRevenue,
        users: usersCount || 0,
        products: productsCount || 0,
        activeServices,
        totalSalary: totalSalary,
        inventoryValue: inventoryValue,
        myKasbon: myKasbonBalance
      },
      recentTransactions: recentTransactions || [],
      sales7Days,
      revenueByBranch,
      serviceAlerts: mappedAlerts,
      userRole: profile?.role
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return {
      kpi: { revenue: 0, users: 0, products: 0, activeServices: { pending: 0, process: 0, done: 0 } },
      recentTransactions: [],
      sales7Days: [],
      revenueByBranch: [],
      serviceAlerts: [],
    };
  }
}
