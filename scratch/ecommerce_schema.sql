-- 1. Tambahkan kolom untuk Produk agar bisa tampil di E-Commerce
ALTER TABLE public.products 
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN image_url TEXT,
ADD COLUMN description TEXT;

-- 2. Buat tabel untuk Pesanan Online
CREATE TABLE public.online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    total_amount NUMERIC NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, completed, cancelled
    shipping_method VARCHAR(100),
    payment_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat tabel untuk Item Pesanan Online (Cart items)
CREATE TABLE public.online_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.online_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS (Row Level Security) untuk tabel baru
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable insert for public" ON public.online_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users" ON public.online_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.online_orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for public" ON public.online_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users" ON public.online_order_items FOR SELECT USING (auth.role() = 'authenticated');
