"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { nhost } from '@/lib/nhost'
import { getBanners, createBanner, updateBanner, deleteBanner, toggleBannerStatus } from '@/app/actions/banners'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// Types
type Banner = {
    id: string
    brand_name: string
    primary_color: string
    background_image_url: string
    is_badge_visible: boolean
    badge_text: string
    badge_icon: string
    title_line_1: string
    title_line_2: string
    description: string
    button_text: string
    button_url: string
    offer_main_text: string
    offer_sub_text: string
    icon_mode: string
    card_icon_class: string
    icon_url_light: string
    icon_url_dark: string
    is_active: boolean
    sort_order: number
}

// Helper Component for Image Fallback
const BannerImage = ({ src, className, style, alt }: { src: string, className?: string, style?: any, alt?: string }) => {
    const [error, setError] = useState(false)

    // Reset error when src changes
    useEffect(() => { setError(false) }, [src])

    if (!src || error) {
        return <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-400 ${className || 'w-full h-full'}`} style={style}>No Img</div>
    }

    return (
        <img 
            src={src} 
            alt={alt || "Banner"} 
            className={className || "w-full h-full object-cover"}
            style={style}
            onError={() => setError(true)}
            referrerPolicy="no-referrer"
        />
    )
}

export default function BannerStudioPage() {
    const { toast } = useToast()
    
    // -- State: Theme & UI --
    const [isDark, setIsDark] = useState(true)
    const [themeColor, setThemeColor] = useState('#E23744')
    const [trendingTheme, setTrendingTheme] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

    // -- State: Files (for upload) --
    // We store the File objects separately. The config state stores the preview URLs (data: or http:)
    const [files, setFiles] = useState<{
        bgImage: File | null,
        iconUrlLight: File | null,
        iconUrlDark: File | null
    }>({
        bgImage: null,
        iconUrlLight: null,
        iconUrlDark: null
    })

    // -- State: Banner Configuration --
    const [config, setConfig] = useState({
        brandName: 'Zomato',
        badgeActive: true,
        badgeText: 'Foodie Special',
        badgeIcon: 'fas fa-utensils',
        titleLine1: 'Zomato',
        titleLine2: 'Gold',
        description: 'Flat 60% OFF on your first dining experience. Grab the deal before it expires!',
        btnText: 'Order Now',
        btnUrl: '',
        offerMain: '60% OFF',
        offerSub: 'Max Discount ₹120',
        bgImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
        
        // Icon Logic
        iconMode: 'icon', // 'icon' | 'url'
        cardIcon: 'fas fa-hamburger',
        iconUrlLight: '',
        iconUrlDark: ''
    })

    // -- State: List --
    const [activeBanners, setActiveBanners] = useState<Banner[]>([])

    // -- Effects --

    // Load Banners on Mount
    useEffect(() => {
        loadBanners()
    }, [])

    const loadBanners = async () => {
        setFetching(true)
        const res = await getBanners()
        if (res.success) {
            setActiveBanners(res.data)
        } else {
            toast({ title: "Error", description: "Failed to load banners", variant: "destructive" })
        }
        setFetching(false)
    }

    // Apply Theme (Dark/Light + Color Variables)
    useEffect(() => {
        const root = document.documentElement
        if (isDark) {
            root.classList.add('dark')
            // Dark Mode Vars
            root.style.setProperty('--bg-color', '#0a0f14')
            root.style.setProperty('--surface-color', '#12181f')
            root.style.setProperty('--card-bg', '#161e25')
            root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)')
            root.style.setProperty('--text-main', '#e7eceb')
            root.style.setProperty('--text-muted', '#9ca3af')
            root.style.setProperty('--icon-bg', 'rgba(255,255,255,0.05)')
            root.style.setProperty('--input-bg', '#161e25')
        } else {
            root.classList.remove('dark')
            // Light Mode Vars
            root.style.setProperty('--bg-color', '#f2f7f8')
            root.style.setProperty('--surface-color', '#ffffff')
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)')
            root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.08)')
            root.style.setProperty('--text-main', '#111827')
            root.style.setProperty('--text-muted', '#6b7280')
            root.style.setProperty('--icon-bg', 'rgba(0,0,0,0.05)')
            root.style.setProperty('--input-bg', '#ffffff')
        }

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null
        }

        const rgb = hexToRgb(themeColor)
        if (rgb) {
            root.style.setProperty('--theme-current', themeColor)
        }

    }, [isDark, themeColor])


    // -- Handlers --

    const handleInputChange = (field: string, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    const handleTrendingTheme = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        setTrendingTheme(val)
        if (val) setThemeColor(val)
    }

    const handleFileUpload = (field: 'bgImage' | 'iconUrlLight' | 'iconUrlDark', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            
            // 1. Store File object for upload later
            setFiles(prev => ({ ...prev, [field]: file }))

            // 2. Creates preview URL
            const reader = new FileReader()
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setConfig(prev => ({ ...prev, [field]: ev.target!.result as string }))
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveBanner = async () => {
        setLoading(true)

        try {
            // 1. Upload Images to Nhost (if new files selected)
            // If editing, config.* might already be URLs.
            let finalBgUrl = config.bgImage
            let finalIconLight = config.iconUrlLight
            let finalIconDark = config.iconUrlDark

            // Helper to upload
            const uploadToNhost = async (file: File) => {
                const { fileMetadata, error } = await nhost.storage.upload({ file })
                if (error) throw error
                return nhost.storage.getPublicUrl({ fileId: fileMetadata.id })
            }

            if (files.bgImage) {
                finalBgUrl = await uploadToNhost(files.bgImage)
            }
            if (files.iconUrlLight) {
                finalIconLight = await uploadToNhost(files.iconUrlLight)
            }
            if (files.iconUrlDark) {
                finalIconDark = await uploadToNhost(files.iconUrlDark)
            }

            // 2. Construct DB Payload
            const payload = {
                brand_name: config.brandName,
                primary_color: themeColor,
                background_image_url: finalBgUrl.startsWith('data:') ? '' : finalBgUrl, 
                
                is_badge_visible: config.badgeActive,
                badge_text: config.badgeText,
                badge_icon: config.badgeIcon,
                
                title_line_1: config.titleLine1,
                title_line_2: config.titleLine2,
                description: config.description,
                
                button_text: config.btnText,
                button_url: config.btnUrl,
                
                offer_main_text: config.offerMain,
                offer_sub_text: config.offerSub,
                
                icon_mode: config.iconMode,
                card_icon_class: config.cardIcon,
                icon_url_light: finalIconLight,
                icon_url_dark: finalIconDark,
                
                is_active: false, // Default to unpublished
                sort_order: editingId ? undefined : activeBanners.length
            }

            // Remove sort_order if updating to avoid mess up or keep it? 
            // Better to not touch sort_order on update unless we implement drag drop.
            if (editingId) {
                delete (payload as any).sort_order
                delete (payload as any).is_active // Don't reset active status on edit
            }

            // 3. Save to DB
            let res
            if (editingId) {
                res = await updateBanner(editingId, payload)
            } else {
                res = await createBanner(payload)
            }

            if (res.success) {
                toast({ title: "Success", description: editingId ? "Banner updated" : "Banner created (Unpublished)" })
                loadBanners() // Refresh list
                
                // Clear Form
                setConfig({
                    brandName: '',
                    badgeActive: true,
                    badgeText: 'New',
                    badgeIcon: 'fas fa-star',
                    titleLine1: '',
                    titleLine2: '',
                    description: '',
                    btnText: 'Shop Now',
                    btnUrl: '',
                    offerMain: '',
                    offerSub: '',
                    bgImage: '',
                    iconMode: 'icon',
                    cardIcon: 'fas fa-star',
                    iconUrlLight: '',
                    iconUrlDark: ''
                })
                setFiles({ bgImage: null, iconUrlLight: null, iconUrlDark: null })
                setEditingId(null)
                setThemeColor('#E23744')
            } else {
                toast({ title: "Error", description: "Failed to save banner", variant: "destructive" })
            }

        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (banner: Banner) => {
        setEditingId(banner.id)
        setThemeColor(banner.primary_color)
        setTrendingTheme(banner.primary_color) // Try to match if it was a preset, otherwise just sets input
        setConfig({
            brandName: banner.brand_name,
            badgeActive: banner.is_badge_visible,
            badgeText: banner.badge_text || '',
            badgeIcon: banner.badge_icon || 'fas fa-star',
            titleLine1: banner.title_line_1 || '',
            titleLine2: banner.title_line_2 || '',
            description: banner.description || '',
            btnText: banner.button_text || '',
            btnUrl: banner.button_url || '',
            offerMain: banner.offer_main_text || '',
            offerSub: banner.offer_sub_text || '',
            bgImage: banner.background_image_url || '',
            iconMode: banner.icon_mode === 'url' ? 'image' : banner.icon_mode, // Normalize legacy 'url' to 'image'
            cardIcon: banner.card_icon_class || 'fas fa-star',
            iconUrlLight: banner.icon_url_light || '',
            iconUrlDark: banner.icon_url_dark || ''
        })
        // clear files since we loaded existing URLs
        setFiles({ bgImage: null, iconUrlLight: null, iconUrlDark: null })
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return
        const res = await deleteBanner(id)
        if (res.success) { 
             toast({ title: "Deleted", description: "Banner removed" })
             loadBanners() 
        } else {
             toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
        }
    }
    
    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const res = await toggleBannerStatus(id, !currentStatus)
        if (res.success) {
            toast({ title: "Updated", description: "Banner status updated" })
            loadBanners()
        }
    }


    // -- Derived Styles for Dynamic Color --
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(themeColor) || ['00', '00', '00', '00']
    const r = parseInt(rgb[1], 16)
    const g = parseInt(rgb[2], 16)
    const b = parseInt(rgb[3], 16)

    // Dynamic Styles Container
    const dynamicStyles = {
        themeTint: { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)` },
        badge: {
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
            color: themeColor,
            borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`
        },
        titleHighlight: { color: themeColor },
        button: {
            backgroundColor: themeColor,
            color: '#ffffff',
            boxShadow: `0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`
        },
        cardGlow: { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.4)` },
        cardIconCircle: { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)` },
        cardIconColor: { color: themeColor }
    }

    const darkR = Math.floor(r * 0.15)
    const darkG = Math.floor(g * 0.15)
    const darkB = Math.floor(b * 0.15)
    const darkColorStr = `rgb(${darkR}, ${darkG}, ${darkB})`
    
    const cardBodyStyle = isDark 
        ? { backgroundImage: `linear-gradient(to bottom right, ${darkColorStr}, #0d1218)`, backgroundColor: 'transparent' }
        : { backgroundColor: 'rgba(255, 255, 255, 0.85)' }


  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300" 
         style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
        
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet" />

        {/* --- Header --- */}
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur-md">
            <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-black flex items-center justify-center text-white font-bold shadow-lg">
                            <i className="fas fa-layer-group"></i>
                        </div>
                        <span className="font-display font-bold text-xl text-[var(--text-main)]">Banner Studio</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--icon-bg)] transition-all">
                        {isDark ? (
                            <i className="fas fa-sun text-yellow-400"></i>
                        ) : (
                            <i className="fas fa-moon text-slate-600"></i>
                        )}
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20"></div>
                </div>
            </div>
        </header>

        {/* --- Main Content --- */}
        <main className="max-w-[1920px] mx-auto px-6 py-8 w-full">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* LEFT: CONTROLS */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="rounded-3xl p-6 space-y-6 glass-panel"
                         style={{ background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
                        
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-display font-bold text-[var(--text-main)] flex items-center gap-2">
                                <i className="fas fa-sliders-h text-[var(--text-muted)]"></i> Configuration
                            </h2>
                            <button 
                                onClick={handleSaveBanner} 
                                disabled={loading}
                                className="px-4 py-1.5 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] font-bold hover:opacity-90 transition-all text-xs flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="w-3 h-3 animate-spin"/>}
                                <i className="fas fa-plus"></i> {editingId ? 'Update Banner' : 'Save Banner'}
                            </button>
                        </div>

                        {/* Theme & Color */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Theme & Color</label>
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <select 
                                    value={trendingTheme} 
                                    onChange={handleTrendingTheme}
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--theme-current)]"
                                >
                                    <option value="">Select Preset...</option>
                                    <option value="#E23744">Zomato Red</option>
                                    <option value="#FF9900">Amazon Orange</option>
                                    <option value="#006AFF">Flipkart Blue</option>
                                    <option value="#10b981">Fresh Green</option>
                                    <option value="#8b5cf6">Royal Violet</option>
                                    <option value="#ec4899">Hot Pink</option>
                                </select>
                                <div className="relative h-10">
                                    <input 
                                        type="color" 
                                        value={themeColor}
                                        onInput={(e) => setThemeColor(e.currentTarget.value)}
                                        className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10" 
                                    />
                                    <div className="w-full h-full rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center gap-2 text-[var(--text-muted)] transition-colors">
                                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: themeColor }}></div>
                                        <span className="text-xs font-mono">{themeColor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            {/* Brand */}
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Brand Name</label>
                                <input 
                                    type="text" 
                                    value={config.brandName} 
                                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]"
                                />
                            </div>

                            {/* Badge */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Badge Configuration</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={config.badgeActive} 
                                            onChange={(e) => handleInputChange('badgeActive', e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-gray-300" 
                                        />
                                        <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Active</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="text" 
                                        value={config.badgeText}
                                        onChange={(e) => handleInputChange('badgeText', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                    <div className="relative">
                                        <select 
                                            value={config.badgeIcon}
                                            onChange={(e) => handleInputChange('badgeIcon', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl text-sm appearance-none bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]"
                                        >
                                            <option value="fas fa-utensils">Utensils</option>
                                            <option value="fas fa-crown">Crown</option>
                                            <option value="fas fa-bolt">Bolt</option>
                                            <option value="fas fa-star">Star</option>
                                            <option value="fas fa-tag">Tag</option>
                                            <option value="fas fa-fire">Fire</option>
                                            <option value="fab fa-amazon">Amazon</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Title Split */}
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Title (White + Highlight)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="text" 
                                        value={config.titleLine1}
                                        onChange={(e) => handleInputChange('titleLine1', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-bold bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                    <input 
                                        type="text" 
                                        value={config.titleLine2}
                                        onChange={(e) => handleInputChange('titleLine2', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-bold bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Description</label>
                                <textarea 
                                    rows={2}
                                    value={config.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl text-sm resize-none bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]"
                                ></textarea>
                            </div>

                            {/* CTA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Button Text</label>
                                    <input 
                                        type="text" 
                                        value={config.btnText}
                                        onChange={(e) => handleInputChange('btnText', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Button URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="/store/zomato"
                                        value={config.btnUrl}
                                        onChange={(e) => handleInputChange('btnUrl', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Logic */}
                        <div className="border-t border-[var(--border-color)] pt-6 mt-6">
                            <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">Floating Card Content</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Offer Main</label>
                                    <input 
                                        type="text" 
                                        value={config.offerMain}
                                        onChange={(e) => handleInputChange('offerMain', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm font-bold bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Offer Detail</label>
                                    <input 
                                        type="text" 
                                        value={config.offerSub}
                                        onChange={(e) => handleInputChange('offerSub', e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                    />
                                </div>
                            </div>

                            {/* Icon Logic */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">Right Icon Source</label>
                                
                                <div className="flex gap-4 text-xs font-bold mb-2">
                                    <button 
                                        onClick={() => handleInputChange('iconMode', 'icon')}
                                        className={config.iconMode === 'icon' ? "text-[var(--text-main)] border-b-2 border-current pb-1" : "text-[var(--text-muted)] pb-1"}
                                    >Font Icon</button>
                                    <button 
                                        onClick={() => handleInputChange('iconMode', 'image')}
                                        className={config.iconMode === 'image' ? "text-[var(--text-main)] border-b-2 border-current pb-1" : "text-[var(--text-muted)] pb-1"}
                                    >Custom Logos (Light/Dark)</button>
                                </div>

                                {config.iconMode === 'icon' ? (
                                    <div className="relative">
                                        <select 
                                            value={config.cardIcon}
                                            onChange={(e) => handleInputChange('cardIcon', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl text-sm appearance-none bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]"
                                        >
                                            <option value="fas fa-hamburger">Hamburger (Food)</option>
                                            <option value="fas fa-utensils">Utensils (Food)</option>
                                            <option value="fas fa-pizza-slice">Pizza (Food)</option>
                                            <option value="fas fa-shopping-cart">Cart (Retail)</option>
                                            <option value="fas fa-tshirt">Apparel (Fashion)</option>
                                            <option value="fas fa-mobile-alt">Mobile (Tech)</option>
                                            <option value="fas fa-gamepad">Gamepad (Gaming)</option>
                                            <option value="fab fa-amazon">Amazon Brand</option>
                                            <option value="fab fa-apple">Apple Brand</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Light Mode Logo</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload('iconUrlLight', e)}
                                                    className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                                />
                                                <div className="w-8 h-8 rounded bg-white border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                                                    {config.iconUrlLight && <BannerImage src={config.iconUrlLight} className="w-full h-full object-contain" alt="light" />}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Rec: 200x200px (PNG Transp)</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Dark Mode Logo</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload('iconUrlDark', e)}
                                                    className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                                                />
                                                <div className="w-8 h-8 rounded bg-gray-900 border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                                                    {config.iconUrlDark && <BannerImage src={config.iconUrlDark} className="w-full h-full object-contain" alt="dark" />}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Rec: 200x200px (PNG White)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Background Image */}
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Background Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload('bgImage', e)}
                                className="w-full px-4 py-2 rounded-xl text-xs bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-main)]" 
                            />
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Size: 1920x500px (Aspect 4:1) - Max 2MB</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW & LIST */}
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* Preview Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-display font-bold text-[var(--text-main)]">Live Preview</h2>
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold">420px Exact Height</span>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-2xl bg-[var(--bg-color)]">
                        <div className="w-full">
                            <div className="relative w-full h-[500px] md:h-[420px] rounded-[2rem] overflow-hidden group">
                                
                                {/* 1. Background Config */}
                                {/* Theme Tint */}
                                <div className="absolute inset-0 transition-colors duration-500" style={dynamicStyles.themeTint}></div>
                                
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent"></div>
                                
                                {/* Image */}
                                {config.bgImage && (
                                    <BannerImage 
                                        src={config.bgImage} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-[2s]" 
                                        alt="Preview BG"
                                    />
                                )}

                                {/* 2. Content Container */}
                                <div className="relative z-20 h-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-8">

                                    {/* 3. Left Text Block */}
                                    <div className="max-w-xl space-y-6 md:translate-x-0 transition-transform duration-700">
                                        
                                        {/* Badge */}
                                        {config.badgeActive && (
                                            <span 
                                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-300"
                                                style={dynamicStyles.badge}
                                            >
                                                <i className={config.badgeIcon}></i>
                                                <span>{config.badgeText}</span>
                                            </span>
                                        )}

                                        {/* H1 Title */}
                                        <h1 className="text-5xl md:text-6xl font-black text-[var(--text-main)] leading-tight drop-shadow-sm">
                                            <span>{config.titleLine1}</span> <br />
                                            <span style={dynamicStyles.titleHighlight} className="transition-colors duration-300">{config.titleLine2}</span>
                                        </h1>

                                        {/* Paragraph */}
                                        <p className="text-lg text-[var(--text-muted)] max-w-md font-medium">{config.description}</p>

                                        {/* Button */}
                                        <div className="flex gap-4 pt-4">
                                            <button 
                                                className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                                                style={dynamicStyles.button}
                                            >
                                                <span>{config.btnText}</span> 
                                                <i className="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4. Right 3D Card Block */}
                                    <div className="hidden md:flex relative group-hover:animate-float" style={{ animationDelay: '1s' }}>
                                        
                                        {/* Glow Behind */}
                                        <div 
                                            className="absolute inset-0 blur-[60px] rounded-full transition-colors duration-300 opacity-60"
                                            style={dynamicStyles.cardGlow}
                                        ></div>

                                        {/* The Card */}
                                        <div 
                                            className="relative w-80 h-96 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl transform rotate-[-3deg] group-hover:rotate-0 transition-all duration-500"
                                            style={cardBodyStyle}
                                        >
                                            
                                            {/* Icon Circle */}
                                            <div 
                                                className="w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-colors duration-300"
                                                style={dynamicStyles.cardIconCircle}
                                            >
                                                
                                                {/* Icon Source Logic */}
                                                {config.iconMode === 'icon' ? (
                                                    <i 
                                                        className={`${config.cardIcon} text-6xl transition-colors duration-300`}
                                                        style={dynamicStyles.cardIconColor}
                                                    ></i>
                                                ) : (
                                                    <BannerImage
                                                        src={isDark ? (config.iconUrlDark || config.iconUrlLight) : config.iconUrlLight} 
                                                        className="w-16 h-16 object-contain" 
                                                        alt="Brand Icon" 
                                                    />
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="text-3xl font-bold mb-2 font-display text-[var(--text-main)] dark:text-white">{config.offerMain}</div>
                                            <div className="text-sm font-medium text-[var(--text-muted)] dark:text-gray-400">{config.offerSub}</div>
                                        </div>

                                    </div>

                                </div>

                            </div>
                        </div>
                    </div>

                    {/* NEW LIST SECTION */}
                    <div className="rounded-3xl p-6 glass-panel"
                         style={{ background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
                        <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-bold text-[var(--text-main)]">Active Banners</h3>
                                  <span className="px-2 py-0.5 rounded-full bg-[var(--icon-bg)] text-xs font-bold text-[var(--text-muted)] border border-[var(--border-color)]">Total: {activeBanners.length}</span>
                             </div>
                             {fetching && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />}
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-[var(--text-muted)] uppercase border-b border-[var(--border-color)]">
                                    <th className="pb-3 pl-2 font-bold tracking-wider">Preview</th>
                                    <th className="pb-3 font-bold tracking-wider">Brand Details</th>
                                    <th className="pb-3 text-center font-bold tracking-wider">Theme</th>
                                    <th className="pb-3 text-center font-bold tracking-wider">Type</th>
                                    <th className="pb-3 text-center font-bold tracking-wider">Status</th>
                                    <th className="pb-3 text-right pr-2 font-bold tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {activeBanners.map(banner => (
                                    <tr key={banner.id} className="group hover:bg-[var(--icon-bg)] transition-colors border-b border-[var(--border-color)]/50">
                                        <td className="py-4 pl-2">
                                            <div 
                                                className="w-16 h-10 rounded-lg bg-cover bg-center shadow-sm border border-[var(--border-color)] overflow-hidden relative"
                                            >
                                                <BannerImage src={banner.background_image_url} />
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-bold text-[var(--text-main)]">{banner.brand_name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{banner.offer_main_text}</div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="w-3 h-3 rounded-full mx-auto shadow-sm ring-2 ring-white/10" style={{ backgroundColor: banner.primary_color }}></div>
                                        </td>
                                        <td className="py-4 text-center text-xs text-[var(--text-muted)]">
                                            <i className={banner.is_badge_visible ? banner.badge_icon : 'fas fa-eye-slash'}></i>
                                        </td>
                                        <td className="py-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={banner.is_active} 
                                                    onChange={() => handleToggleStatus(banner.id, banner.is_active)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(banner)} className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center">
                                                    <i className="fas fa-pen text-xs"></i>
                                                </button>
                                                <button onClick={() => handleDelete(banner.id)} className="w-8 h-8 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                    <i className="fas fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeBanners.length === 0 && !fetching && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                                            No banners found. Create one above!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    </div>

                </div>
            </div>
        </main>
    </div>
  )
}
