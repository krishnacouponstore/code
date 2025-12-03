"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
  CheckCircle,
  Zap,
  ShoppingBag,
  Download,
  Wallet,
  Shield,
  HeadphonesIcon,
  BadgeCheck,
  RefreshCw,
  UserPlus,
  CreditCard,
  MousePointerClick,
  FileDown,
  ArrowRight,
} from "lucide-react"

export default function AboutPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const keyPoints = [
    {
      icon: BadgeCheck,
      title: "100% Genuine Codes",
      description: "All codes are verified and authentic",
    },
    {
      icon: Zap,
      title: "Instant Delivery",
      description: "Get your codes immediately after purchase",
    },
    {
      icon: ShoppingBag,
      title: "Bulk Discounts",
      description: "Save more when you buy in larger quantities",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Safe and encrypted transactions",
    },
    {
      icon: Download,
      title: "Re-downloadable",
      description: "Access your purchased codes anytime",
    },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: UserPlus,
      title: "Create Account",
      description: "Sign up with your email in seconds",
    },
    {
      step: 2,
      icon: CreditCard,
      title: "Add Balance",
      description: "Load money to your wallet securely",
    },
    {
      step: 3,
      icon: MousePointerClick,
      title: "Choose & Buy",
      description: "Browse coupons and purchase instantly",
    },
    {
      step: 4,
      icon: FileDown,
      title: "Download Codes",
      description: "Get your codes in CSV/TXT format",
    },
  ]

  const whyChooseUs = [
    {
      icon: Wallet,
      title: "Competitive Pricing",
      description: "Best rates in the market with bulk discounts",
    },
    {
      icon: Zap,
      title: "Instant Delivery",
      description: "No waiting - codes delivered immediately",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data and payments are safe with us",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description: "Our team is always here to help",
    },
    {
      icon: CheckCircle,
      title: "Quality Guarantee",
      description: "All codes verified before upload",
    },
    {
      icon: RefreshCw,
      title: "Easy Re-downloads",
      description: "Lost your codes? Download them again anytime",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About CodeCrate</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your Trusted Marketplace for Genuine Coupon Codes
          </p>
        </section>

        {/* What We Do Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-6">What We Do</h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            CodeCrate is a reliable platform where you can purchase genuine coupon codes for popular e-commerce and food
            delivery platforms. We source authentic discount codes in bulk and offer them at competitive prices, making
            online shopping more affordable for everyone.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {keyPoints.map((point, index) => (
              <Card
                key={index}
                className="bg-gradient-to-b from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] border-[hsl(160,20%,85%)] dark:border-[hsl(200,15%,20%)] rounded-2xl transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 transition-transform duration-300 hover:scale-110">
                    <point.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{point.title}</h3>
                  <p className="text-xs text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <Card className="bg-gradient-to-b from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] border-[hsl(160,20%,85%)] dark:border-[hsl(200,15%,20%)] rounded-2xl h-full transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                      {item.step}
                    </div>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 transition-transform duration-300 hover:scale-110">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Why Choose CodeCrate</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((feature, index) => (
              <Card
                key={index}
                className="bg-gradient-to-b from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] border-[hsl(160,20%,85%)] dark:border-[hsl(200,15%,20%)] rounded-2xl transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 transition-transform duration-300 hover:scale-110">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="mb-20">
          <Card className="bg-gradient-to-b from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] border-[hsl(160,20%,85%)] dark:border-[hsl(200,15%,20%)] rounded-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our mission is to make online shopping more affordable by providing easy access to genuine discount
                codes. We believe everyone deserves to save money while shopping online.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA Section */}
        <section>
          <Card className="bg-gradient-to-b from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] border-[hsl(160,20%,85%)] dark:border-[hsl(200,15%,20%)] rounded-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Have Questions?</h2>
                  <p className="text-muted-foreground">Get in touch with us for any queries or support</p>
                </div>
                <Link href="/contact">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 font-medium text-lg gap-2 transition-transform duration-300 hover:scale-105">
                    Contact Us
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
