"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { useBanners } from "@/hooks/use-banners"
import { useStores } from "@/hooks/use-stores"
import { useFavorites } from "@/hooks/use-favorites"
import { StoreCard } from "@/components/store-card"

// Helper to convert hex to rgba for backgrounds
const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return 'rgba(0,0,0,0)';
    // Remove hash if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function StorePage() {
  const { theme, setTheme } = useTheme()
  const { data: banners = [], isLoading } = useBanners()
  const { data: stores = [], isLoading: isStoresLoading } = useStores()
  const { isFavorite } = useFavorites()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter stores
  const filteredStores = stores.filter(store => {
    let matchesCategory = true;
    if (selectedCategory === "Favourites") {
        matchesCategory = isFavorite(store.id);
    } else if (selectedCategory !== "All") {
        matchesCategory = store.category === selectedCategory;
    }

    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          store.category?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  // Carousel Logic
  const totalSlides = banners.length || 1 
  
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 5000)
    return () => clearInterval(interval)
  }, [totalSlides, banners.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <>
      <style jsx global>{`
        :root {
            /* Light Theme Variables */
            --bg-color: #f2f7f8;
            --surface-color: #ffffff;
            --card-bg: rgba(255, 255, 255, 0.8);
            --border-color: rgba(0, 0, 0, 0.08); 
            --text-main: #111827;
            --text-muted: #6b7280;
            --glass-shadow: 0 8px 32px 0 rgba(100, 100, 111, 0.05);
            --nav-bg: #ffffff;
            --icon-bg: rgba(0,0,0,0.05);
            --input-bg: #ffffff;

            /* Decorative Gradients */
            --bg-gradient-1: rgba(120, 252, 214, 0.15); 
            --bg-gradient-2: rgba(59, 130, 246, 0.08);  
        }

        .dark {
            /* Dark Theme Variables */
            --bg-color: #0a0f14;
            --surface-color: #12181f;
            --card-bg: #161e25;
            --border-color: rgba(255, 255, 255, 0.08);
            --text-main: #e7eceb;
            --text-muted: #7d8a94;
            --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            --nav-bg: #0a0f14;
            --icon-bg: rgba(255,255,255,0.05);
            --input-bg: #161e25;

             /* Decorative Gradients */
            --bg-gradient-1: rgba(120, 252, 214, 0.05);
            --bg-gradient-2: rgba(59, 130, 246, 0.05);
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            background-image: 
                radial-gradient(circle at 15% 50%, var(--bg-gradient-1) 0%, transparent 25%),
                radial-gradient(circle at 85% 30%, var(--bg-gradient-2) 0%, transparent 25%);
            transition: background-color 0.4s ease, color 0.4s ease;
        }
        
        .glass-panel {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            box-shadow: var(--glass-shadow);
        }
        
        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
            border-color: rgba(120, 252, 214, 0.3);
            transform: translateY(-5px);
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        }

        .carousel-track {
            display: flex;
            transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .carousel-slide {
            min-width: 100%;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb { background: #252f38; }
        ::-webkit-scrollbar-thumb:hover { background: #78fcd6; }

        /* Dynamic Store Card Styles */
        .store-card-hover:hover {
            border-color: var(--store-color-faded);
            box-shadow: 0 10px 40px -10px var(--store-color-faded);
            transform: translateY(-4px);
        }
        .store-card-hover:hover .store-title {
            color: var(--store-color);
        }
        .store-card-hover:hover .store-arrow-btn {
            background-color: var(--store-color);
            color: white;
            border-color: var(--store-color);
        }
        .store-card-hover:hover .store-gradient-overlay {
            opacity: 1;
        }
      `}</style>

    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/30 selection:text-white">
        
        {/* Floating Navbar */}
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl pt-32">
            
            {/* Animated Carousel Section */}
            <section className="relative rounded-[2rem] overflow-hidden mb-16 border border-[var(--border-color)] shadow-2xl bg-[var(--card-bg)]">
                
                {/* Carousel Track */}
                <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    
                    {isLoading ? (
                         <div className="carousel-slide">
                            <div className="relative w-full h-[500px] md:h-[420px] rounded-[2rem] overflow-hidden bg-[var(--surface-color)] animate-pulse flex items-center justify-center">
                                <div className="text-[var(--text-muted)]">Loading offers...</div>
                            </div>
                        </div>
                    ) : banners.length > 0 ? (
                        banners.map((banner) => (
                            <div className="carousel-slide" key={banner.id}>
                                <div className="relative w-full h-[500px] md:h-[420px] rounded-[2rem] overflow-hidden group">
                                    {/* Dynamic Background via overlay (Light/Dark aware) */}
                                    <div 
                                        className="absolute inset-0"
                                        style={{ backgroundColor: hexToRgba(banner.primary_color, 0.1) }}
                                    ></div>
                                    
                                    {/* Left Gradient Overlay - White in Light Mode, Black in Dark Mode */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent dark:from-black/90 dark:via-black/60 dark:to-transparent z-10 transition-colors duration-300"></div>

                                    {banner.background_image_url && (
                                        <img 
                                            src={banner.background_image_url} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay group-hover:scale-105 transition-transform duration-[2s]" 
                                            alt={banner.brand_name} 
                                        />
                                    )}
                                    
                                    <div className="relative z-20 h-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-8">
                                        <div className="max-w-xl space-y-6 md:translate-x-0 transition-transform duration-700">
                                            {banner.is_badge_visible && (
                                                <span 
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border"
                                                    style={{ 
                                                        backgroundColor: hexToRgba(banner.primary_color, 0.1), 
                                                        color: banner.primary_color,
                                                        borderColor: hexToRgba(banner.primary_color, 0.3)
                                                    }}
                                                >
                                                    {banner.badge_icon && <i className={`${banner.badge_icon} mr-2`}></i>} {banner.badge_text}
                                                </span>
                                            )}
                                            <h1 className="text-5xl md:text-6xl font-black text-[var(--text-main)] leading-tight drop-shadow-sm">
                                                {banner.title_line_1} <br/><span style={{ color: banner.primary_color }}>{banner.title_line_2}</span>
                                            </h1>
                                            <p className="text-lg text-[var(--text-muted)] max-w-md font-medium">
                                                {banner.description}
                                            </p>
                                            <div className="flex gap-4 pt-4">
                                                <Link href={banner.button_url ? `/store/${banner.button_url}` : '#'}>
                                                    <button 
                                                        className="px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg text-white"
                                                        style={{ 
                                                            backgroundColor: banner.primary_color,
                                                            boxShadow: `0 4px 14px ${hexToRgba(banner.primary_color, 0.4)}`
                                                        }}
                                                    >
                                                        {banner.button_text} <i className="fas fa-arrow-right"></i>
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                        
                                        {/* 3D Card Effect */}
                                        <div className="hidden md:flex relative group-hover:animate-float">
                                            <div 
                                                className="absolute inset-0 blur-[60px] rounded-full opacity-40 dark:opacity-60"
                                                style={{ backgroundColor: hexToRgba(banner.primary_color, 0.4) }}
                                            ></div>
                                            
                                            {/* Offer Card - Light/Dark Variant */}
                                            <div className="relative w-80 h-96 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] transform rotate-[-6deg] group-hover:rotate-0 transition-all duration-500">
                                                <div 
                                                    className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                                    style={{ backgroundColor: hexToRgba(banner.primary_color, 0.1) }}
                                                >
                                                    {banner.icon_mode === 'image' ? (
                                                        <>
                                                            {/* Show Light URL by default (for light mode) */}
                                                            <img 
                                                                src={banner.icon_url_light || banner.icon_url_dark} 
                                                                className="w-20 h-20 object-contain dark:hidden" 
                                                                alt="icon" 
                                                            />
                                                            {/* Show Dark URL in dark mode (fallback to light) */}
                                                            <img 
                                                                src={banner.icon_url_dark || banner.icon_url_light} 
                                                                className="w-20 h-20 object-contain hidden dark:block" 
                                                                alt="icon" 
                                                            />
                                                        </>
                                                    ) : (
                                                        <i className={`${banner.card_icon_class || 'fas fa-tag'} text-6xl`} style={{ color: banner.primary_color }}></i>
                                                    )}
                                                </div>
                                                <div className="text-3xl font-bold text-[var(--text-main)] mb-2">{banner.offer_main_text}</div>
                                                <div className="text-sm text-[var(--text-muted)] font-medium">{banner.offer_sub_text}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="carousel-slide">
                            <div className="relative w-full h-[500px] md:h-[420px] rounded-[2rem] overflow-hidden bg-[var(--surface-color)] flex items-center justify-center">
                                <div className="text-[var(--text-muted)] text-xl">No active offers available</div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Navigation UI */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-2.5 rounded-full bg-[var(--surface-color)]/90 backdrop-blur-xl border border-[var(--border-color)] shadow-xl">
                    <button onClick={prevSlide} className="w-9 h-9 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all text-[var(--text-main)] shadow-sm group">
                        <i className="fas fa-arrow-left text-xs group-hover:-translate-x-0.5 transition-transform"></i>
                    </button>
                    
                    <div className="flex items-center gap-2 mx-2">
                        {isLoading ? (
                             <div className="h-1.5 w-8 rounded-full bg-[var(--text-muted)] opacity-20" />
                        ) : banners.length > 0 ? (
                            banners.map((banner, idx) => (
                                <div 
                                    key={banner.id}
                                    onClick={() => goToSlide(idx)} 
                                    className={`h-1.5 rounded-full cursor-pointer transition-all ${currentSlide === idx ? 'w-8 shadow-sm' : 'w-1.5 bg-[var(--text-main)] opacity-20 hover:opacity-40'}`}
                                    style={{ backgroundColor: currentSlide === idx ? banner.primary_color : undefined }}
                                ></div>
                            ))
                        ) : (
                             <div className="h-1.5 w-8 rounded-full bg-[var(--text-muted)] opacity-20" />
                        )}
                    </div>

                    <button onClick={nextSlide} className="w-9 h-9 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all text-[var(--text-main)] shadow-sm group">
                        <i className="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
                    </button>
                </div>
            </section>


            {/* Search & Filter Bar */}
            <div className="mb-12 sticky top-24 z-40">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-[var(--background)]/95 backdrop-blur-xl border-y border-[var(--border-color)] py-4 -mx-4 px-4 shadow-xl">
                    
                    {/* Modern Search Input */}
                    <div className="relative w-full lg:w-96 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fas fa-search text-[var(--text-muted)] group-focus-within:text-primary transition-colors"></i>
                        </div>
                        <input type="text" 
                            className="block w-full pl-11 pr-4 py-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm text-[var(--text-main)]" 
                            placeholder="Search for brands, deals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] rounded-lg">CTRL K</kbd>
                        </div>
                    </div>

                    {/* Color-Coded Categories */}
                    <div className="flex gap-3 overflow-x-auto w-full lg:w-auto pb-1 scrollbar-hide">
                        {[
                            { name: "All", icon: "fas fa-layer-group", color: null },
                            { name: "Favourites", icon: "fas fa-heart", color: null, shadow: null }, 
                            { name: "Food", icon: null, color: "bg-orange-500", shadow: "rgba(249,115,22,0.8)" },
                            { name: "Groceries", icon: null, color: "bg-blue-500", shadow: "rgba(59,130,246,0.8)" },
                            { name: "Travel", icon: null, color: "bg-yellow-500", shadow: "rgba(234,179,8,0.8)" },
                            { name: "Movies", icon: null, color: "bg-red-500", shadow: "rgba(239,68,68,0.8)" },
                            { name: "Electronics", icon: null, color: "bg-indigo-500", shadow: "rgba(99,102,241,0.8)" },
                            { name: "Fashion", icon: null, color: "bg-pink-500", shadow: "rgba(236,72,153,0.8)" },
                            { name: "Other", icon: "fas fa-box-open", color: null, shadow: null }, 
                        ].map((cat) => (
                            <button  
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap group ${
                                    selectedCategory === cat.name 
                                    ? "bg-[var(--text-main)] text-[var(--bg-color)]" 
                                    : "bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--card-bg)]"
                                }`}
                            >
                                {cat.icon && <i className={cat.icon}></i>}
                                {cat.color && (
                                    <span className={`w-2 h-2 rounded-full ${cat.color} transition-shadow ${selectedCategory !== cat.name ? 'group-hover:shadow-[0_0_8px_var(--shadow-color)]' : ''}`} style={selectedCategory !== cat.name ? { '--shadow-color': cat.shadow } as React.CSSProperties : {}}></span>
                                )}
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Brands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {isStoresLoading ? (
                     // Skeleton Loading
                     Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] p-6 h-[280px] animate-pulse">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-[var(--surface-color)]"></div>
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-[var(--surface-color)] rounded"></div>
                                    <div className="h-4 w-20 bg-[var(--surface-color)] rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="flex gap-2">
                                    <div className="h-6 w-20 bg-[var(--surface-color)] rounded"></div>
                                    <div className="h-6 w-20 bg-[var(--surface-color)] rounded"></div>
                                </div>
                            </div>
                        </div>
                     ))
                ) : filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                        <StoreCard key={store.id} store={store} />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
                        No stores found matching your criteria.
                    </div>
                )}
            </div>

        </main>
    </div>
    </>
  )
}
