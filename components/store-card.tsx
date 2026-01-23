"use client"

import React from "react"
import Link from "next/link"
import { Store } from "@/hooks/use-stores"

const hexToRgba = (hex: string, alpha: number) => {
    hex = hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface StoreCardProps {
    store: Store
}

export function StoreCard({ store }: StoreCardProps) {
    const themeColor = store.theme_color || '#3b82f6'
    // Fallback if hexToRgba fails (e.g. invalid hex)
    const safeHexToRgba = (color: string, alpha: number) => {
        try {
            return hexToRgba(color, alpha)
        } catch (e) {
            return color
        }
    }
    
    return (
        <Link 
            href={`/store/${store.slug || store.id}`} 
            className="group store-card-hover relative rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] overflow-hidden transition-all duration-500 shadow-md block"
            style={{ 
                "--store-color": themeColor,
                "--store-color-faded": safeHexToRgba(themeColor, 0.3)
            } as React.CSSProperties}
        >
            <div 
                className="store-gradient-overlay absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(to bottom right, ${safeHexToRgba(themeColor, 0.15)}, transparent, transparent)` }}
            ></div>
            
            <div className="p-6 relative z-10">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md store-icon-box">
                        {store.logo_url?.startsWith('http') || store.logo_url?.startsWith('/') ? (
                                <img src={store.logo_url} alt={store.name} className="w-12 h-12 object-contain" />
                        ) : (
                                <i className={`${store.logo_url || 'fas fa-store'} text-4xl`} style={{ color: themeColor }}></i>
                        )}
                    </div>
                    <div>
                        <h3 className="store-title text-2xl font-bold text-[var(--text-main)] transition-colors">{store.name}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{store.category}</p>
                    </div>
                </div>
                
                <div className="space-y-4 mb-6 h-12">
                    <div className="flex flex-wrap gap-2">
                            {store.store_tags && store.store_tags.slice(0, 3).map((tag, idx) => (
                            <div key={idx} 
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 uppercase tracking-wide"
                                    style={{
                                        backgroundColor: safeHexToRgba(tag.color, 0.1),
                                        borderColor: safeHexToRgba(tag.color, 0.2),
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        color: tag.color
                                    }}
                            >
                                {tag.tag_icon && <i className={tag.tag_icon}></i>} {tag.value}
                            </div>
                            ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                    <div className="text-xs text-[var(--text-muted)] font-medium">
                        <span className="text-[var(--text-main)] font-bold text-base">{store.slots_aggregate?.aggregate?.count || 0}</span> Active Coupons
                    </div>
                    <div className="store-arrow-btn w-8 h-8 rounded-full bg-[var(--surface-color)] flex items-center justify-center transition-all text-[var(--text-muted)] border border-transparent">
                        <i className="fas fa-arrow-right text-xs -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
                    </div>
                </div>
            </div>
        </Link>
    )
}
