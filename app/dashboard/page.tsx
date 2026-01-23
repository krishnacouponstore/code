"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useRecentPurchases } from "@/hooks/use-user-stats"
import { Navbar } from "@/components/navbar"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { hasAuthCookie } from "@/lib/check-auth-cookie"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth()
    const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()
    const { data: purchases, isLoading: purchasesLoading } = useRecentPurchases()
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()
    const [retryCount, setRetryCount] = useState(0)

    // Auth protection logic
    useEffect(() => {
        if (!authLoading && isAuthenticated && !profileLoading && !profile && retryCount < 3) {
            const timer = setTimeout(() => {
                refetchProfile()
                setRetryCount((prev) => prev + 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [authLoading, isAuthenticated, profileLoading, profile, retryCount, refetchProfile])

    useEffect(() => {
        if (isLoggingOut) return

        // Don't redirect if auth cookie exists (session is being restored)
        if (!authLoading && !isAuthenticated && !hasAuthCookie()) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
            return
        }

        // Redirect admin to admin dashboard with toast
        if (!authLoading && isAuthenticated && user?.is_admin) {
            toast({
                title: "Access Restricted",
                description: "Admin users should use the admin dashboard",
                variant: "default",
                duration: 5000,
            })
            router.replace("/admin/dashboard")
            return
        }
    }, [authLoading, isAuthenticated, user, router, pathname, isLoggingOut, toast])

    // Block rendering if admin (before showing user content)
    if (!authLoading && isAuthenticated && user?.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                </div>
            </div>
        )
    }

    const isLoading = authLoading || profileLoading || !profile

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-bolt text-primary text-xl animate-pulse"></i>
                    </div>
                </div>
            </div>
        )
    }

    // Derived State
    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User"
    const balance = profile?.wallet_balance || 0

    // Use DB data for stats instead of calculating from recent purchases
    const couponCount = profile?.total_purchased || 0
    const totalSpent = profile?.total_spent || 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 pt-32">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">
                            Welcome back, {displayName}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your account today.</p>
                    </div>

                    <Link href="/add-balance">
                        <button className="bg-primary hover:brightness-110 text-primary-foreground font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
                            <i className="fas fa-plus"></i>
                            Add Balance
                        </button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Wallet Card */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 h-48 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        {/* Decorative Background Icon */}
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <i className="fas fa-wallet text-8xl text-primary"></i>
                        </div>
                        {/* SVG Background */}
                        <svg className="absolute bottom-0 right-0 w-32 h-32 text-primary opacity-10 transform translate-y-10 translate-x-10 transition-transform duration-700 group-hover:translate-x-5 group-hover:translate-y-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.3C87.4,-33.5,90.1,-18,89,-2.6C87.9,12.7,83,27.9,74.5,40.6C66,53.3,53.9,63.5,40.6,71.2C27.3,78.9,12.9,84.1,-0.7,85.3C-14.3,86.5,-27.4,83.7,-39.8,76.5C-52.2,69.3,-63.9,57.7,-71.7,44.4C-79.5,31.1,-83.4,16,-82.1,1.5C-80.8,-13,-74.3,-26.9,-65.4,-39.1C-56.5,-51.3,-45.2,-61.8,-32.6,-69.7C-20,-77.6,-6.1,-82.9,6.1,-93.5L18.3,-104.1L18.3,0L6.1,0C-6.1,0,-20,0,-32.6,0C-45.2,0,-56.5,0,-65.4,0C-74.3,0,-80.8,0,-82.1,0C-83.4,0,-79.5,0,-71.7,0C-63.9,0,-52.2,0,-39.8,0C-27.4,0,-14.3,0,-0.7,0C12.9,0,27.3,0,40.6,0C53.9,0,66,0,74.5,0C83,0,87.9,0,89,0C90.1,0,87.4,0,79.6,0C71.8,0,58.9,0,44.7,0Z" transform="translate(100 100)" />
                        </svg>

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-emerald-700 dark:text-primary">
                                <i className="fas fa-wallet text-xl"></i>
                            </div>
                            <Link href="/add-balance">
                                <button className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-black transition-all">
                                    Top Up
                                </button>
                            </Link>
                        </div>

                        <div className="relative z-10">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</div>
                            <div className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">₹{balance.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Purchased Coupons Card */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 h-48 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        {/* Decorative Background */}
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <i className="fas fa-ticket-alt text-8xl text-blue-500"></i>
                        </div>
                        {/* SVG Wave Background */}
                        <svg className="absolute bottom-0 left-0 w-full h-24 text-blue-500 opacity-10 transition-transform duration-700 group-hover:scale-110" viewBox="0 0 1440 320" preserveAspectRatio="none">
                            <path fill="currentColor" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                        </svg>

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                                <i className="fas fa-ticket-alt text-xl"></i>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Purchased Coupons</div>
                            <div className="flex items-end gap-3">
                                <div className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">{couponCount}</div>
                                <div className="mb-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                                    <i className="fas fa-history text-[10px]"></i> Lifetime
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 h-48 flex flex-col justify-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <i className="fas fa-chart-pie text-8xl text-purple-500"></i>
                        </div>

                        {/* SVG Sparkline Background */}
                        <svg className="absolute bottom-0 left-0 w-full h-16 opacity-20 text-purple-500 transition-transform duration-700 group-hover:scale-x-110" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M0 20 L0 10 Q10 15 20 5 T40 10 T60 5 T80 12 L100 8 L100 20 Z" fill="currentColor" />
                        </svg>

                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 text-purple-400">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Total Spent</div>
                            <div className="text-3xl font-display font-bold text-gray-900 dark:text-white">₹{totalSpent.toFixed(2)}</div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-purple-400 bg-purple-500/5 w-fit px-2 py-1 rounded border border-purple-500/10">
                                All time total
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Recent Purchases Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Table */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Purchases</h2>
                            <Link href="/history" className="text-primary hover:text-black dark:text-primary dark:hover:text-white text-xs font-bold uppercase tracking-wide transition-colors">
                                View All
                            </Link>
                        </div>

                        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-slate-700/30 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Store</th>
                                            <th className="px-6 py-4">Coupon Name</th>
                                            <th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {purchases && purchases.length > 0 ? (
                                            purchases.slice(0, 5).map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-white/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer text-sm">
                                                    <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                                                        #{purchase.id.slice(0, 8)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {purchase.slot?.store ? (
                                                            <Link href={`/store/${purchase.slot.store.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                                {purchase.slot.store.logo_url && (
                                                                    <Image
                                                                        src={purchase.slot.store.logo_url}
                                                                        alt={purchase.slot.store.name}
                                                                        width={28}
                                                                        height={28}
                                                                        className="rounded-lg object-cover"
                                                                    />
                                                                )}
                                                                <span className="text-gray-900 dark:text-white font-medium text-sm">{purchase.slot.store.name}</span>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900 dark:text-white">{purchase.slot?.name || "Store Item"}</div>
                                                        <div className="text-xs text-info mt-0.5">{purchase.slot?.name || "Coupon"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xs">
                                                            {purchase.quantity} codes
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                        ₹{purchase.total_price}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <i className="fas fa-shopping-bag text-4xl text-gray-300 dark:text-gray-600 mb-2"></i>
                                                        <p>No purchases yet</p>
                                                        <Link href="/store" className="text-primary hover:underline text-sm font-bold">Browse Store</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Cards */}
                    <div className="space-y-6">
                        {/* Refer Card */}
                        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary-dark dark:text-primary animate-pulse-slow">
                                    <i className="fas fa-store text-2xl"></i>
                                </div>
                                <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white mb-2">Great Deals</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">Looking for something specific? Check our store for more offers.</p>
                                <Link href="/store" className="w-full">
                                    <button className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                                        Visit Store
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Help Card */}
                        <Link href="/contact" className="block group">
                            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-all transform hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-200 dark:border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-headset"></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white">Need Help?</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Support</p>
                                </div>
                                <i className="fas fa-chevron-right text-gray-400 group-hover:text-primary transition-colors"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
