"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Access to all coupons",
        "Standard delivery",
        "Email support",
        "Basic download formats",
        "Purchase history",
      ],
      buttonText: "Get Started",
      buttonClass: "bg-zinc-300 text-gray-800 hover:bg-zinc-400",
    },
    {
      name: "Pro",
      price: "Popular",
      description: "Best value for regular users",
      features: [
        "Everything in Basic",
        "Priority support on Telegram",
        "Bulk download options",
        "Early access to new coupons",
        "Price drop alerts",
        "Dedicated account manager",
        "Custom order requests",
      ],
      buttonText: "Contact Us",
      buttonClass: "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For businesses and resellers",
      features: [
        "Everything in Pro",
        "Volume discounts",
        "API access",
        "White-label options",
        "Dedicated support line",
      ],
      buttonText: "Talk to Sales",
      buttonClass: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    },
  ]

  return (
    <section
      id="pricing"
      className="w-full px-5 overflow-hidden flex flex-col justify-start items-center py-16 md:py-24"
    >
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-3xl md:text-5xl font-semibold leading-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Choose the plan that fits your needs. Upgrade anytime as you grow.
          </p>
        </div>
      </div>

      <div className="self-stretch px-5 flex flex-col md:flex-row justify-center items-stretch gap-4 md:gap-6 mt-10 max-w-[1100px] mx-auto">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={`flex-1 p-6 overflow-hidden rounded-xl flex flex-col justify-between gap-6 ${
              plan.popular
                ? "bg-primary shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.10)]"
                : "bg-gradient-to-b from-gray-50/5 to-gray-50/0"
            }`}
            style={plan.popular ? {} : { outline: "1px solid hsl(var(--border))", outlineOffset: "-1px" }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className={`text-sm font-medium ${plan.popular ? "text-primary-foreground" : "text-zinc-200"}`}>
                  {plan.name}
                  {plan.popular && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20 text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                </div>
                <div>
                  <div
                    className={`text-3xl font-semibold ${plan.popular ? "text-primary-foreground" : "text-zinc-50"}`}
                  >
                    {plan.price}
                  </div>
                  <div className={`text-sm mt-1 ${plan.popular ? "text-primary-foreground/70" : "text-zinc-400"}`}>
                    {plan.description}
                  </div>
                </div>
              </div>

              <Link href="/signup">
                <Button className={`w-full rounded-full ${plan.buttonClass}`}>{plan.buttonText}</Button>
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${plan.popular ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
