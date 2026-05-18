"use server";
import { createClient } from "@/lib/supabase/server";

export async function getOnlineProducts() {
  try {
    const supabase = await createClient();
    
    // We try to fetch products where is_online is true.
    // If the column doesn't exist yet, this will throw an error, which we catch.
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        retail_price,
        is_online,
        is_featured,
        image_url,
        description,
        categories ( name ),
        stock ( quantity )
      `)
      .eq("is_online", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process the data
    return data.map((p) => {
      const categoryName = Array.isArray(p.categories) 
        ? p.categories[0]?.name 
        : p.categories?.name;
      
      const totalStock = p.stock?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.retail_price,
        category: categoryName || "Uncategorized",
        stock: totalStock,
        isFeatured: p.is_featured || false,
        image: p.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400`,
        description: p.description || "Produk berkualitas dari JTCell."
      };
    });

  } catch (err) {
    // If the error is about 'is_featured' missing, try fallback query
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          retail_price,
          is_online,
          image_url,
          description,
          categories ( name ),
          stock ( quantity )
        `)
        .eq("is_online", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((p) => {
        const categoryName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
        const totalStock = p.stock?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0;

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.retail_price,
          category: categoryName || "Uncategorized",
          stock: totalStock,
          isFeatured: false,
          image: p.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400`,
          description: p.description || "Produk berkualitas dari JTCell."
        };
      });
    } catch (fallbackErr) {
      console.warn("Fallback query also failed:", fallbackErr.message);
      return [];
    }
  }
}

export async function submitOrder(orderData, cartItems) {
  try {
    const supabase = await createClient();

    // 1. Insert order
    const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const { data: order, error: orderError } = await supabase
      .from("online_orders")
      .insert({
        customer_name: orderData.name,
        customer_phone: orderData.phone,
        customer_address: orderData.address,
        payment_method: orderData.paymentMethod,
        total_amount: totalAmount,
        status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert items
    // Using mock IDs if the products are mock, so we filter them out to prevent DB errors
    const validItems = cartItems.filter(item => !item.id.toString().startsWith("mock-"));
    
    if (validItems.length > 0) {
      const orderItemsInsert = validItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from("online_order_items")
        .insert(orderItemsInsert);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        // We do not fail the order completely if items fail, but we should handle it
        throw itemsError;
      }
    }

    return { success: true, orderId: order.id };
  } catch (err) {
    console.error("Error submitting order:", err);
    return { success: false, error: err.message };
  }
}
