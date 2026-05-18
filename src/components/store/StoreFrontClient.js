"use client";

import { useState } from "react";
import Link from "next/link";
import { submitOrder } from "@/app/actions/store";

export default function StoreFrontClient({ products }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout states
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "", paymentMethod: "Transfer Bank" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [helpModal, setHelpModal] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroActiveTab, setHeroActiveTab] = useState("preorder");

  const filteredProducts = products.filter(p => {
    const isSparepart = p.category.toLowerCase().includes("sparepart") || p.category.toLowerCase().includes("servis") || p.category.toLowerCase().includes("lcd") || p.category.toLowerCase().includes("part");
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    if (activeCategory === "Semua") return !isSparepart; // Hide spareparts from home page to keep it clean
    if (activeCategory === "Smartphone") return p.category === "HP";
    if (activeCategory === "Aksesoris") return p.category.toLowerCase().includes("aksesori");
    if (activeCategory === "Servis HP") return isSparepart;
    return p.category === activeCategory;
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot add more than stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Open cart for better UX
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return removeFromCart(id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        // limit by stock
        const qty = newQty > item.stock ? item.stock : newQty;
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    const result = await submitOrder(checkoutForm, cart);
    
    setIsSubmitting(false);
    if (result.success) {
      setOrderSuccess(true);
      setCart([]);
    } else {
      alert("Gagal memproses pesanan: " + result.error);
    }
  };

  const preOrderProduct = products.find(p => p.name.toUpperCase().includes('PRE ORDER') || p.name.toUpperCase().includes('PRE-ORDER')) || products.find(p => p.isFeatured) || products[0];
  const discountProduct = products.find(p => (p.name.toUpperCase().includes('PROMO') || p.name.toUpperCase().includes('DISCOUNT') || p.name.toUpperCase().includes('SALE') || p.name.toUpperCase().includes('CUCI GUDANG') || p.name.toUpperCase().includes('CLEARANCE')) && p.id !== preOrderProduct?.id) || products.find(p => p.id !== preOrderProduct?.id && p.image && !p.image.includes('ui-avatars')) || products[1];
  const activeHeroProduct = heroActiveTab === "preorder" ? preOrderProduct : discountProduct;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-white">devices</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              JTCell
            </span>
          </div>

          {isSearchOpen ? (
            <div className="flex-1 max-w-lg relative animate-fade-in">
              <input 
                type="text" 
                placeholder="Cari smartphone, aksesoris, atau sparepart..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Auto scroll to products so user sees the results
                  const el = document.getElementById("products");
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-full py-2 px-5 pl-12 text-sm text-white placeholder-white/40 focus:outline-none transition-all"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-4 top-2 text-white/40">search</span>
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} 
                className="absolute right-4 top-2.5 text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
              <button onClick={() => { setActiveCategory("Semua"); window.location.href = "#"; }} className={`${activeCategory === "Semua" ? "text-indigo-400 font-bold" : "text-white hover:text-indigo-400"} transition-colors cursor-pointer`}>Home</button>
              <button onClick={() => { setActiveCategory("Smartphone"); window.location.href = "#products"; }} className={`${activeCategory === "Smartphone" ? "text-indigo-400 font-bold" : "hover:text-white"} transition-colors cursor-pointer`}>Smartphone</button>
              <button onClick={() => { setActiveCategory("Aksesoris"); window.location.href = "#products"; }} className={`${activeCategory === "Aksesoris" ? "text-indigo-400 font-bold" : "hover:text-white"} transition-colors cursor-pointer`}>Aksesoris</button>
              <button onClick={() => { setActiveCategory("Servis HP"); window.location.href = "#products"; }} className={`${activeCategory === "Servis HP" ? "text-indigo-400 font-bold" : "hover:text-white"} transition-colors cursor-pointer`}>Servis HP</button>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {!isSearchOpen && (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors relative"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-rose-500/30">
                  {cartItemCount}
                </span>
              )}
            </button>
            <Link href="/login" className="hidden md:flex items-center gap-2 btn-gradient px-5 py-2 text-sm rounded-full">
              <span>Masuk Sistem</span>
              <span className="material-symbols-outlined text-[18px]">login</span>
            </Link>
            
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Toko Online Resmi JTCell
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                Upgrade <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Gadgetmu</span> <br/> Hari Ini Juga.
              </h1>
              <p className="text-lg text-white/60 max-w-lg leading-relaxed">
                Pusat handphone dan aksesoris original terlengkap. Beli sekarang, kami antar sampai ke depan rumah Anda atau ambil di cabang terdekat.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a href="#products" className="btn-gradient px-8 py-4 rounded-xl text-base flex items-center gap-2 group">
                  Belanja Sekarang
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </div>
            
            <div className="relative animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="relative z-10 glass-card p-5 w-full max-w-[440px] mx-auto flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-500 shadow-2xl hover:shadow-indigo-500/10 group">
                
                {/* Dynamic Tab Selector */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-4">
                  <button 
                    onClick={() => setHeroActiveTab("preorder")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      heroActiveTab === "preorder" 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                    Pre-Order HP
                  </button>
                  <button 
                    onClick={() => setHeroActiveTab("discount")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      heroActiveTab === "discount" 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">sell</span>
                    Discount HP
                  </button>
                </div>

                {/* Top Badge & Status Icon */}
                <div className="flex items-center justify-between mb-4">
                  {heroActiveTab === "preorder" ? (
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                      Pre-Order Eksklusif
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                      Promo / Discount HP
                    </span>
                  )}
                  <span className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${heroActiveTab === "preorder" ? 'text-indigo-400' : 'text-rose-400'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {heroActiveTab === "preorder" ? 'local_fire_department' : 'campaign'}
                    </span>
                  </span>
                </div>

                {/* Product Image Container */}
                <div className="h-64 flex items-center justify-center bg-white/[0.02] rounded-2xl p-4 overflow-hidden relative">
                  {activeHeroProduct?.image ? (
                    <img 
                      src={activeHeroProduct.image} 
                      alt={activeHeroProduct.name} 
                      className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
                    />
                  ) : (
                    <div className="text-white/20 flex flex-col items-center">
                      <span className="material-symbols-outlined text-5xl">smartphone</span>
                      <span className="text-[10px] mt-2">No Image</span>
                    </div>
                  )}
                </div>

                {/* Bottom Product Info & CTA Panel */}
                <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                        {activeHeroProduct?.name || "Flagship Smartphone"}
                      </h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-1">
                        {activeHeroProduct?.description || "Garansi resmi, kualitas terbaik di kelasnya."}
                      </p>
                    </div>
                    {activeHeroProduct?.price && (
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Harga Spesial</span>
                        <span className="text-base font-extrabold text-white">
                          Rp {Number(activeHeroProduct.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                  <a 
                    href={`https://wa.me/6281246050589?text=Halo%20JTCell,%20saya%20tertarik%20dengan%20${heroActiveTab === "preorder" ? 'Pre-Order' : 'Promo%20Discount'}%20untuk%20produk:%20${encodeURIComponent(activeHeroProduct?.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 rounded-xl text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                      heroActiveTab === "preorder" 
                        ? 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20' 
                        : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {heroActiveTab === "preorder" ? 'shopping_bag' : 'local_mall'}
                    </span>
                    {heroActiveTab === "preorder" ? 'Pre-Order via WhatsApp' : 'Ambil Discount via WhatsApp'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog */}
        <div id="products" className="max-w-7xl mx-auto px-6 mt-32">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : activeCategory === "Servis HP" ? "Sparepart & Servis" : "Produk Pilihan"}
              </h2>
              <p className="text-white/60">
                {searchQuery ? `Menampilkan ${filteredProducts.length} produk yang cocok.` : activeCategory === "Servis HP" ? "Suku cadang berkualitas untuk perbaikan gadget Anda." : "Gadget terbaik dengan harga spesial untuk Anda."}
              </p>
            </div>
          </div>

          {/* Service Warning Banner */}
          {activeCategory === "Servis HP" && (
            <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center gap-5 text-amber-200 animate-fade-slide-up">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-400 text-3xl">build_circle</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-400 text-lg mb-1">Pusat Servis Profesional JTCell</h3>
                <p className="text-sm opacity-90 leading-relaxed">Harga yang tertera di bawah ini adalah <strong>Harga Sparepart (Suku Cadang)</strong> saja. Untuk biaya pengerjaan / jasa pemasangan, silakan langsung menghubungi teknisi kami untuk mendapatkan estimasi total biaya.</p>
              </div>
              <a href="https://wa.me/6281246050589?text=Halo%20JTCell,%20saya%20ingin%20konsultasi%20mengenai%20Servis%20HP" target="_blank" rel="noopener noreferrer" className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-amber-500/20">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                Konsultasi Teknisi
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => {
              const isPreOrder = product.name.toUpperCase().includes('PRE ORDER') || product.name.toUpperCase().includes('PRE-ORDER');
              const isSparepart = product.category.toLowerCase().includes("sparepart") || product.category.toLowerCase().includes("servis") || product.category.toLowerCase().includes("lcd") || product.category.toLowerCase().includes("part");
              return (
              <div 
                key={product.id} 
                className="group glass-card border border-white/5 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer overflow-hidden animate-fade-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-56 overflow-hidden bg-white/5 p-4 flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xl"
                    />
                  ) : (
                    <div className="text-white/20 flex flex-col items-center">
                      <span className="material-symbols-outlined text-5xl">smartphone</span>
                      <span className="text-[10px] mt-2">No Image</span>
                    </div>
                  )}
                  {isPreOrder ? (
                    <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg shadow-amber-500/20">
                      PRE-ORDER
                    </div>
                  ) : product.stock <= 5 && product.stock > 0 ? (
                    <div className="absolute top-3 left-3 bg-rose-500/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg shadow-rose-500/20">
                      Sisa {product.stock}
                    </div>
                  ) : product.stock === 0 ? (
                    <div className="absolute top-3 left-3 bg-zinc-800/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg">
                      Habis Terjual
                    </div>
                  ) : null}
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-indigo-400 font-bold mb-1 uppercase tracking-widest">{product.category}</p>
                  <h3 className="text-base font-semibold mb-2 text-white/90 group-hover:text-white line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-white/40 line-clamp-2 mb-4">
                    {product.description || "Spesifikasi mumpuni dengan harga terbaik di kelasnya."}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-lg font-bold">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </p>
                    {isPreOrder ? (
                      <a 
                        href={`https://wa.me/6281246050589?text=Halo%20JTCell,%20saya%20tertarik%20untuk%20Pre-Order%20produk%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                        title="Pre-Order via WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      </a>
                    ) : isSparepart ? (
                      <a 
                        href={`https://wa.me/6281246050589?text=Halo%20JTCell,%20saya%20ingin%20tanya%20biaya%20pemasangan%20untuk%20sparepart%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        title="Tanya Biaya Pemasangan"
                      >
                        <span className="material-symbols-outlined text-[18px]">build</span>
                      </a>
                    ) : (
                      <button 
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          product.stock > 0 
                            ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {cart.some(item => item.id === product.id) ? 'check' : 'add_shopping_cart'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-white/20 mb-3">inventory_2</span>
              <p className="text-white/60">Belum ada produk di kategori ini.</p>
            </div>
          )}

          {/* Note Banner at the bottom of the catalog */}
          <div className="mt-16 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mx-auto sm:mx-0">
                <span className="material-symbols-outlined text-[24px]">contact_support</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">
                  Belum ada hp, asesoris dan sparepart di dalam list???
                </h4>
                <p className="text-sm text-white/60">
                  Tenang, tidak semua ditampilkan. bisa kontak admin ya
                </p>
              </div>
            </div>
            <a 
              href="https://wa.me/6281246050589?text=Halo%20JTCell,%20saya%20ingin%20menanyakan%20produk%20HP,%20aksesoris,%20atau%20sparepart%20yang%20belum%20ada%20di%20website" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              <span>Tanya Admin</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0E1A] py-12 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[18px]">devices</span>
              </div>
              <span className="text-lg font-bold">JTCell</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Toko Handphone terpercaya dengan garansi resmi dan pelayanan terbaik di seluruh area.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Bantuan</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><button onClick={() => setHelpModal('cara-belanja')} className="hover:text-white transition-colors cursor-pointer">Cara Belanja</button></li>
              <li><button onClick={() => setHelpModal('pengiriman')} className="hover:text-white transition-colors cursor-pointer">Pengiriman</button></li>
              <li><button onClick={() => setHelpModal('klaim-garansi')} className="hover:text-white transition-colors cursor-pointer">Klaim Garansi</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Kontak</h4>
            <ul className="space-y-5 text-sm text-white/50">
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 font-semibold text-white/80">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  JTCell Ruteng
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <a href="https://maps.app.goo.gl/ztjXQtqSyhY7ZTev6" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 underline decoration-white/20 underline-offset-2 transition-colors">Ruteng, Manggarai</a>
                </div>
                <div className="pl-6">
                  <a href="https://wa.me/6281246050589" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all text-xs font-bold w-fit">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    0812-4605-0589
                  </a>
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 font-semibold text-white/80">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  JTCell Riung
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <a href="https://maps.app.goo.gl/nRZo1mECjfj3okHa7" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 underline decoration-white/20 underline-offset-2 transition-colors">Riung</a>
                </div>
                <div className="pl-6">
                  <a href="https://wa.me/6281239637775" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all text-xs font-bold w-fit">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    0812-3963-7775
                  </a>
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 font-semibold text-white/80">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  JTCell Larantuka
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <a href="https://maps.app.goo.gl/Xm1JEEvaUFSUJx64A" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 underline decoration-white/20 underline-offset-2 transition-colors">Larantuka</a>
                </div>
                <div className="pl-6">
                  <a href="https://wa.me/6281246282157" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all text-xs font-bold w-fit">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    0812-4628-2157
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* CART OVERLAY & DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative w-full max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl animate-slide-in-right border-l border-white/5">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">shopping_cart</span>
                Keranjang Belanja
              </h2>
              <button 
                onClick={() => { setIsCartOpen(false); setIsCheckout(false); setOrderSuccess(false); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {orderSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-fade-slide-up">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Pesanan Berhasil!</h3>
                    <p className="text-sm text-white/60">Terima kasih telah berbelanja di JTCell. Admin kami akan segera memproses pesanan Anda dan menghubungi Anda via WhatsApp.</p>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setOrderSuccess(false); setIsCheckout(false); }}
                    className="mt-4 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition-colors"
                  >
                    Lanjutkan Belanja
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
                  <span className="material-symbols-outlined text-5xl">remove_shopping_cart</span>
                  <p>Keranjang Anda masih kosong.</p>
                </div>
              ) : isCheckout ? (
                <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-5 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-indigo-400 font-bold mb-2 cursor-pointer" onClick={() => setIsCheckout(false)}>
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Kembali ke Keranjang
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Nama Lengkap</label>
                    <input required className="input-field bg-white/5 border-white/10" placeholder="John Doe" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Nomor HP / WhatsApp</label>
                    <input required type="tel" className="input-field bg-white/5 border-white/10" placeholder="0812..." value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Alamat Pengiriman (Bisa diisi "Ambil di Toko")</label>
                    <textarea required className="input-field bg-white/5 border-white/10 min-h-[80px]" placeholder="Alamat lengkap..." value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Metode Pembayaran</label>
                    <select className="input-field bg-white/5 border-white/10" value={checkoutForm.paymentMethod} onChange={e => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Bayar di Tempat (COD)">Bayar di Tempat (COD)</option>
                      <option value="Bayar di Toko">Bayar di Toko</option>
                    </select>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 relative group">
                      <div className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 p-2">
                        {item.image ? (
                           <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                           <span className="material-symbols-outlined text-white/20 text-3xl">image</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-indigo-400 font-bold mb-0.5">{item.category}</p>
                          <h4 className="text-sm font-semibold leading-snug pr-6">{item.name}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                          <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined text-[16px]">add</span></button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-3 right-3 text-white/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {!orderSuccess && cart.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-[#0F172A] z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 font-medium">Total Harga</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                {isCheckout ? (
                  <button 
                    onClick={handleCheckoutSubmit}
                    disabled={isSubmitting || !checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
                    className="w-full btn-gradient py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin">sync</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        Selesaikan Pesanan
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsCheckout(true)}
                    className="w-full btn-gradient py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                  >
                    Lanjut Pembayaran
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HELP MODALS */}
      {helpModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setHelpModal(null)} />
          <div className="relative w-full max-w-lg bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">
                  {helpModal === 'cara-belanja' ? 'shopping_bag' : helpModal === 'pengiriman' ? 'local_shipping' : 'verified'}
                </span>
                {helpModal === 'cara-belanja' ? 'Cara Belanja' : helpModal === 'pengiriman' ? 'Informasi Pengiriman' : 'Klaim Garansi'}
              </h2>
              <button onClick={() => setHelpModal(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar text-white/70 space-y-4 text-sm leading-relaxed">
              {helpModal === 'cara-belanja' && (
                <>
                  <p>Berbelanja di JTCell sangat mudah dan aman. Ikuti langkah-langkah berikut:</p>
                  <ol className="list-decimal list-inside space-y-3 pl-2">
                    <li>Pilih produk yang Anda inginkan dari katalog di halaman utama.</li>
                    <li>Klik ikon <strong>Keranjang</strong> pada produk tersebut. Jika produk merupakan <em>Pre-Order</em>, Anda akan diarahkan langsung ke WhatsApp Admin.</li>
                    <li>Setelah selesai memilih, buka keranjang belanja di pojok kanan atas layar.</li>
                    <li>Isi <strong>Nama Lengkap</strong>, <strong>Nomor WhatsApp</strong>, dan <strong>Alamat Lengkap</strong> (atau tulis "Ambil di Toko" jika ingin mengambil sendiri).</li>
                    <li>Pilih metode pembayaran yang tersedia (Transfer Bank, COD, atau Bayar di Toko).</li>
                    <li>Klik <strong>Selesaikan Pesanan</strong>. Tim admin kami akan segera menghubungi Anda via WhatsApp untuk konfirmasi dan proses selanjutnya!</li>
                  </ol>
                </>
              )}
              {helpModal === 'pengiriman' && (
                <>
                  <p>Kami melayani pengiriman ke seluruh wilayah dengan ketentuan sebagai berikut:</p>
                  <ul className="list-disc list-inside space-y-3 pl-2">
                    <li><strong>Pengiriman Dalam Kota (COD):</strong> Khusus area Ruteng, Riung, dan Larantuka, kami melayani sistem COD (Bayar di Tempat) menggunakan kurir toko. <strong className="text-emerald-400">Gratis Ongkir</strong> untuk pengiriman dalam radius maksimal <strong>10 KM</strong> dari cabang terdekat. Jika di luar radius tersebut, harap konfirmasi ongkir dengan Admin kami.</li>
                    <li><strong>Luar Kota / Pulau:</strong> Kami menggunakan jasa ekspedisi terpercaya (JNE, J&T, Sicepat) yang dilengkapi asuransi pengiriman agar barang aman sampai tujuan.</li>
                    <li><strong>Waktu Proses:</strong> Pesanan yang dikonfirmasi sebelum jam 15:00 WITA akan diproses di hari yang sama.</li>
                    <li>Resi pengiriman atau update status kurir akan selalu diinformasikan ke nomor WhatsApp Anda.</li>
                  </ul>
                </>
              )}
              {helpModal === 'klaim-garansi' && (
                <>
                  <p>Kepercayaan Anda adalah prioritas kami. Semua produk HP dan elektronik yang dijual di JTCell bergaransi resmi.</p>
                  <ul className="list-disc list-inside space-y-3 pl-2">
                    <li><strong>Garansi Resmi:</strong> Anda bisa langsung membawa unit HP ke Service Center resmi terdekat (Samsung, Vivo, Xiaomi, Oppo, dll) di kota Anda.</li>
                    <li><strong>Bantuan Klaim JTCell:</strong> Jika Anda kesulitan, bawa unit yang bermasalah beserta nota pembelian fisik/digital ke cabang JTCell terdekat. Tim kami akan membantu proses klaim Anda ke Service Center pusat.</li>
                    <li><strong>Syarat Klaim:</strong> Pastikan kerusakan bukan karena kesalahan pengguna (jatuh, kena air) dan stiker/segel garansi serta dus box masih dalam kondisi baik sesuai ketentuan dari merk yang bersangkutan.</li>
                  </ul>
                  <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <p className="font-semibold mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">support_agent</span> Hubungi Admin</p>
                    <p className="text-xs">Jika Anda ragu mengenai garansi produk yang dibeli, jangan ragu untuk menghubungi WhatsApp cabang kami melalui menu Kontak di bagian bawah website.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-72 bg-[#0F172A] h-full flex flex-col shadow-2xl animate-slide-in-left border-r border-white/5">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">devices</span>
                </div>
                <span className="text-lg font-bold">JTCell</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 py-6 px-4 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider px-3 mb-1">Navigasi</p>
                <button 
                  onClick={() => { setActiveCategory("Semua"); setIsMobileMenuOpen(false); window.location.href = "#"; }} 
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === "Semua" ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => { setActiveCategory("Smartphone"); setIsMobileMenuOpen(false); window.location.href = "#products"; }} 
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === "Smartphone" ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  Smartphone
                </button>
                <button 
                  onClick={() => { setActiveCategory("Aksesoris"); setIsMobileMenuOpen(false); window.location.href = "#products"; }} 
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === "Aksesoris" ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  Aksesoris
                </button>
                <button 
                  onClick={() => { setActiveCategory("Servis HP"); setIsMobileMenuOpen(false); window.location.href = "#products"; }} 
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === "Servis HP" ? "bg-indigo-500/10 text-indigo-400 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  Servis HP
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider px-3 mb-1">Bantuan</p>
                <button onClick={() => { setHelpModal('cara-belanja'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">Cara Belanja</button>
                <button onClick={() => { setHelpModal('pengiriman'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">Pengiriman</button>
                <button onClick={() => { setHelpModal('klaim-garansi'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">Klaim Garansi</button>
              </div>

              <div className="mt-auto border-t border-white/5 pt-6 flex flex-col gap-2">
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 btn-gradient py-3 text-sm rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                >
                  <span>Masuk Sistem</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
