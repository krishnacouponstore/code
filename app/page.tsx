"use client"

import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { CTASection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"
import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

function HomeContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "access_denied") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access that page.",
      })
      window.history.replaceState({}, "", "/")
    }
  }, [searchParams, toast])

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  )
}
