"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useStores } from "@/hooks/use-stores"
import { useSlots } from "@/hooks/use-slots"
import { useFavorites } from "@/hooks/use-favorites"
import { PurchaseModal } from "@/components/coupons/purchase-modal"
import { cn } from "@/lib/utils"
import { 
    ArrowLeft, 
    Sun, 
    Moon, 
    Heart, 
    Tag, 
    Clock, 
    Info 
} from "lucide-react"

// Helper: Hex to HSL
function hexToHSL(hex: string) {
  let c: any = hex.substring(1).split('');
  if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  let r = (c >> 16) & 255;
  let g = (c >> 8) & 255;
  let b = c & 255;
  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: stores = [], isLoading: isStoresLoading } = useStores()
  const { data: slots = [], isLoading: isSlotsLoading } = useSlots() // Use proper backend filtering in production
  const { isFavorite, toggleFavorite, isToggling } = useFavorites()
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [selectedSlotForInfo, setSelectedSlotForInfo] = useState<typeof storeSlots[0] | null>(null)

  // Find Store
  const store = useMemo(() => {
    return stores.find(s => {
        // Handle slug, ID, and name matching
        return (s.slug === params.storeName) || 
               (s.id === params.storeName) ||
               (s.name.toLowerCase().replace(/\s+/g, '-') === params.storeName)
    })
  }, [stores, params.storeName])

  // Filter Slots for this store
  const storeSlots = useMemo(() => {
      if (!store) return []
      return slots.filter(s => {
          const slotStoreId = s.store?.id;
          const currentStoreId = store.id;
          // Case insensitive comparison for robustness
          const isStoreMatch = slotStoreId && currentStoreId && slotStoreId.toLowerCase() === currentStoreId.toLowerCase();
          return isStoreMatch && s.is_published;
      })
  }, [slots, store])

  // Dynamic Theme Variables
  const themeVars = useMemo(() => {
      if (!store?.theme_color) return {}
      const { h, s, l } = hexToHSL(store.theme_color)
      return {
          '--brand-hue': h,
          '--brand-sat': `${s}%`,
          '--brand-light': `${l}%`,
          '--brand-color': `hsl(${h}, ${s}%, ${l}%)`,
          '--brand-glow': `hsla(${h}, ${s}%, ${l}%, 0.3)`,
          '--brand-dark': `hsla(${h}, ${s}%, 15%, 1)`,
      } as React.CSSProperties
  }, [store?.theme_color])

  if (isStoresLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
              <div className="w-16 h-16 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin"></div>
          </div>
      )
  }

  if (!store) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
              <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
              <Link href="/store" className="text-primary hover:underline">Return to Directory</Link>
          </div>
      )
  }

  return (
    <div 
        className="min-h-screen bg-[var(--bg-color)] text-[var(--text-main)] font-sans transition-colors duration-300"
        style={themeVars}
    >
        <style jsx global>{`
            :root {
                --bg-color: #f3f4f6;
                --surface-color: #ffffff;
                --card-base: #ffffff;
                --sidebar-bg: #ffffff;
                --border-color: rgba(0,0,0,0.08);
                --text-main: #111827;
                --text-muted: #6b7280;
                --brand-bg: rgba(0,0,0,0.03);
                --modal-bg: rgba(255, 255, 255, 0.9);
                --bg-gradient-1: hsla(var(--brand-hue), var(--brand-sat), 20%, 0.8); 
                --bg-gradient-2: rgba(0,0,0,0.02);
            }
            .dark {
                --bg-color: #0a0f14;
                --surface-color: #12181f;
                --card-base: linear-gradient(160deg, #161e25 0%, #0e1216 100%);
                --sidebar-bg: linear-gradient(180deg, rgba(22, 30, 37, 0.8) 0%, rgba(10, 15, 20, 0.9) 100%);
                --border-color: rgba(255,255,255,0.08);
                --text-main: #ecf0f1;
                --text-muted: #9ca3af;
                --brand-bg: rgba(255,255,255,0.03);
                --modal-bg: rgba(0,0,0,0.85);
                --bg-gradient-1: var(--brand-dark);
                --bg-gradient-2: #12181f;
            }
            body { 
                background-color: var(--bg-color);
                color: var(--text-main);
                transition: background-color 0.3s, color 0.3s;
                background-image: 
                    radial-gradient(circle at 10% 0%, var(--bg-gradient-1) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, var(--bg-gradient-2) 0%, transparent 40%);
            }
            .product-card {
                background: var(--card-base);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .product-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent, var(--brand-color), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .product-card:hover {
                transform: translateY(-5px) scale(1.01);
                border-color: var(--brand-glow);
                box-shadow: 0 15px 40px -10px rgba(0,0,0,0.15);
            }
            .dark .product-card:hover {
                box-shadow: 0 15px 40px -10px rgba(0,0,0,0.6);
            }
            .product-card:hover::before {
                opacity: 1;
            }
            .icon-box {
                background: var(--brand-bg);
                color: var(--brand-color);
                border: 1px solid var(--border-color);
                transition: all 0.3s ease;
            }
            .product-card:hover .icon-box {
                background: var(--brand-color);
                color: #fff;
                box-shadow: 0 0 20px var(--brand-glow);
            }
            .btn-brand {
                background-color: var(--brand-color);
                color: white;
                font-weight: 700;
                border: none;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                z-index: 1;
            }
            .btn-brand::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(rgba(255,255,255,0.4), transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            .btn-brand:hover {
                transform: translateY(-1px);
                box-shadow: 0 0 20px var(--brand-glow);
            }
            .btn-brand:hover::after {
                opacity: 1;
            }
            .btn-glass {
                background: var(--brand-bg);
                color: var(--text-muted);
                border: 1px solid var(--border-color);
                transition: all 0.3s ease;
            }
            .btn-glass:hover {
                background: var(--border-color);
                color: var(--text-main);
                border-color: var(--text-muted);
            }
            .glass-panel {
                background: var(--surface-color);
                backdrop-filter: blur(12px);
                border: 1px solid var(--border-color);
            }
            .sidebar-brand {
                background: var(--sidebar-bg);
                border: 1px solid var(--border-color);
                box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
            }
            .nav-link {
                transition: all 0.2s;
                border-left: 2px solid transparent;
                color: var(--text-muted);
            }
            .nav-link:hover, .nav-link.active {
                background: linear-gradient(90deg, var(--brand-glow) 0%, transparent 100%);
                border-left-color: var(--brand-color);
                color: var(--text-main);
            }
            .price-tag {
                transition: border-color 0.3s;
            }
            .product-card:hover .price-tag {
                border-color: var(--brand-glow);
            }
            .badge {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 4px 8px;
                border-radius: 6px;
            }
            .badge-low-stock {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.2);
            }
            .badge-best-seller {
                background: var(--brand-glow);
                color: var(--brand-color);
                border: 1px solid var(--brand-color);
            }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--brand-color); }
            @keyframes pulse-glow {
                0% { box-shadow: 0 0 0 0 var(--brand-glow); }
                70% { box-shadow: 0 0 0 10px transparent; }
                100% { box-shadow: 0 0 0 0 transparent; }
            }
        `}</style>
        
        {/* Top Navigation Dock */}
        <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/store" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--border-color)] transition-colors">
                        <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors font-medium">Return to</span>
                        <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--brand-color)] transition-colors">Store Directory</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--border-color)] transition-all text-[var(--text-main)] shadow-sm">
                        <Sun className="w-4 h-4 block dark:hidden text-yellow-500" />
                        <Moon className="w-4 h-4 hidden dark:block text-blue-400" />
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto pt-8 pb-12 px-4 flex flex-col md:flex-row gap-8">
            
            {/* Sidebar / Info Panel */}
            <aside className="w-full md:w-80 shrink-0 space-y-6">
                <div className="sticky top-24 space-y-6">
                    {/* Brand Card */}
                    <div className="sidebar-brand rounded-3xl overflow-hidden p-6 text-center relative group">
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--brand-glow)]/30 to-transparent opacity-50"></div>
                        
                        <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 relative z-10 p-2 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain" />
                        </div>
                        
                        <h1 className="text-2xl font-bold mb-2 text-[var(--text-main)]">{store.name}</h1>
                        <p className="text-sm text-[var(--text-muted)] mb-6 font-medium leading-relaxed">{store.description}</p>
                        
                        <button 
                            onClick={() => toggleFavorite(store.id)}
                            disabled={isToggling}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                                isFavorite(store.id) 
                                    ? "bg-[var(--brand-color)] text-white shadow-[0_0_20px_var(--brand-glow)]" 
                                    : "bg-[var(--brand-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--brand-color)]"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", isFavorite(store.id) ? "fill-current text-white" : "text-[var(--text-muted)]")} />
                            {isFavorite(store.id) ? "Favourited" : "Add to Favourites"}
                        </button>
                    </div>

                </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1">
                {/* Available Inventory Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-main)] mb-1">Available Inventory</h2>
                    <p className="text-[var(--text-muted)]">Select a coupon package to purchase instantly.</p>
                </div>

                {/* Filters */}
                <div className="flex justify-end gap-2 mb-8 overflow-x-auto">
                    {['Popular', 'Lowest Price', 'Most Stock'].map((filter, idx) => (
                        <button key={filter} className={cn(
                            "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border border-[var(--border-color)]",
                            idx === 0 
                                ? "bg-[var(--brand-color)] text-white shadow-lg shadow-[var(--brand-glow)]" 
                                : "bg-[var(--surface-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--brand-color)]"
                        )}>
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Coupons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {storeSlots.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
                            No active coupons found for this store.
                        </div>
                    ) : (
                        storeSlots.map((slot) => {
                            const lowestPrice = slot.pricing_tiers?.length > 0 
                                ? Math.min(...slot.pricing_tiers.map(t => Number(t.unit_price))) 
                                : 0

                            return (
                                <div key={slot.id} className="product-card p-6 group h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="icon-box w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
                                            <Tag className="w-6 h-6" />
                                        </div>
                                        
                                        {/* Badges */}
                                        <div className="flex flex-col gap-2 items-end">
                                            {slot.available_stock < 20 && (
                                                <span className="badge badge-low-stock">Low Stock</span>
                                            )}
                                            {slot.available_stock > 100 && (
                                                <span className="badge badge-best-seller">Best Seller</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-auto">
                                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--brand-color)] transition-colors">{slot.name}</h3>

                                        {/* Compact thumbnail text + expiry: {thumbnail} • {expiry} */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {slot.thumbnail && (
                                                <span className="text-sm font-semibold text-[var(--brand-color)]">{slot.thumbnail}</span>
                                            )}
                                            {slot.thumbnail && slot.expiry_date && (
                                                <span className="text-sm text-[var(--text-muted)]">•</span>
                                            )}
                                            {slot.expiry_date && (
                                                <span className="text-sm font-semibold text-[var(--brand-color)]">{new Date(slot.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="price-tag">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Starting Price</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-[var(--text-main)]">₹{lowestPrice}</span>
                                                <span className="text-sm text-[var(--text-muted)]">/ code</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-3">
                                            <button 
                                                onClick={() => {
                                                    setSelectedSlotId(slot.id)
                                                    setPurchaseModalOpen(true)
                                                }}
                                                className="col-span-4 btn-brand py-3 rounded-xl text-sm uppercase tracking-wide font-bold"
                                            >
                                                Buy Now
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setSelectedSlotForInfo(slot)
                                                    setInfoModalOpen(true)
                                                }}
                                                className="col-span-1 btn-glass rounded-xl flex items-center justify-center text-lg"
                                            >
                                                <Info className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>
        </main>

        <PurchaseModal 
            slotId={selectedSlotId}
            open={purchaseModalOpen}
            onOpenChange={setPurchaseModalOpen}
            brandColor={store?.theme_color}
        />
        
        {/* Info Modal */}
        {infoModalOpen && selectedSlotForInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--modal-bg)', backdropFilter: 'blur(8px)' }} onClick={() => setInfoModalOpen(false)}>
                <div 
                    className="w-full max-w-lg mx-4 rounded-3xl shadow-2xl overflow-hidden transform flex flex-col max-h-[85vh]" 
                    style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-color)' }}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{selectedSlotForInfo.name}</h3>
                            <button 
                                onClick={() => setInfoModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                style={{ background: 'var(--border-color)' }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-4">
                        {/* Description */}
                        <details className="group rounded-2xl overflow-hidden border" style={{ background: 'var(--brand-bg)', borderColor: 'var(--border-color)' }} open>
                            <summary className="px-4 py-3 cursor-pointer font-semibold flex items-center justify-between" style={{ color: 'var(--text-main)' }}>
                                <span>📝 Description</span>
                                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="px-4 py-3 border-t text-sm leading-relaxed" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                {selectedSlotForInfo.description}
                            </div>
                        </details>

                        {/* How to Redeem */}
                        {selectedSlotForInfo.redemption_steps && selectedSlotForInfo.redemption_steps.length > 0 && (
                            <details className="group rounded-2xl overflow-hidden border" style={{ background: 'var(--brand-bg)', borderColor: 'var(--border-color)' }}>
                                <summary className="px-4 py-3 cursor-pointer font-semibold flex items-center justify-between" style={{ color: 'var(--text-main)' }}>
                                    <span>🎯 How to Redeem</span>
                                    <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    <ol className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        {selectedSlotForInfo.redemption_steps.map((step) => (
                                            <li key={step.id} className="flex gap-3">
                                                <span className="font-bold" style={{ color: 'var(--brand-color)' }}>{step.step_number}.</span>
                                                <span>
                                                    {step.step_text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => (
                                                        /https?:\/\//.test(part) ? (
                                                            <a
                                                                key={i}
                                                                href={part}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sky-600 underline hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300"
                                                                aria-label={`Open link ${part} in a new tab`}
                                                            >
                                                                {part}
                                                            </a>
                                                        ) : (
                                                            <React.Fragment key={i}>{part}</React.Fragment>
                                                        )
                                                    ))}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </details>
                        )}

                        {/* Expiry Info */}
                        {selectedSlotForInfo.expiry_date && (
                            <div className="rounded-xl p-4 border" style={{ background: 'var(--brand-bg)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--brand-color)' }}>
                                    <Clock className="w-4 h-4" />
                                    <span>Valid until: {new Date(selectedSlotForInfo.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}
