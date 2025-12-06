import { IndianRupee, DollarSign, Euro, PoundSterling } from "lucide-react"

// Currency configuration - can be extended to fetch from database later
const CURRENCY_CONFIG = {
  INR: {
    code: "INR",
    symbol: "₹",
    icon: IndianRupee,
    locale: "en-IN",
  },
  USD: {
    code: "USD",
    symbol: "$",
    icon: DollarSign,
    locale: "en-US",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    icon: Euro,
    locale: "de-DE",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    icon: PoundSterling,
    locale: "en-GB",
  },
} as const

type CurrencyCode = keyof typeof CURRENCY_CONFIG

// Default currency - can be changed or fetched from database/env
const DEFAULT_CURRENCY: CurrencyCode = "INR"

export function useSystemSettings() {
  // For now, use a static currency. This can be extended to fetch from database later.
  const currencyCode = DEFAULT_CURRENCY
  const config = CURRENCY_CONFIG[currencyCode]

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return {
    currencyCode: config.code,
    currencySymbol: config.symbol,
    CurrencyIcon: config.icon,
    formatPrice,
  }
}
