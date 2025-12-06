import { Shield, Zap, Wallet, Clock, Download, HeadphonesIcon } from "lucide-react"

const BentoCard = ({
  title,
  description,
  icon: Icon,
  className = "",
}: { title: string; description: string; icon: any; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl border border-white/20 flex flex-col relative ${className}`}>
    {/* Glassmorphism background */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

    <div className="relative z-10 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-foreground text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

export function FeaturesSection() {
  const features = [
    {
      title: "Instant Delivery",
      description:
        "Get your coupon codes instantly after purchase. No waiting, no delays - just immediate access to your savings.",
      icon: Zap,
    },
    {
      title: "Verified Codes",
      description:
        "Every coupon is verified and tested before listing. We guarantee 99% working rate on all our codes.",
      icon: Shield,
    },
    {
      title: "Secure Wallet",
      description:
        "Add funds to your wallet and purchase coupons with ease. Your balance is always secure and ready to use.",
      icon: Wallet,
    },
    {
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to help you with any questions or issues.",
      icon: HeadphonesIcon,
    },
    {
      title: "Bulk Downloads",
      description: "Purchase multiple coupons and download them all at once in CSV or TXT format for easy management.",
      icon: Download,
    },
    {
      title: "Real-time Updates",
      description:
        "Stock levels and prices update in real-time. Never miss out on limited-time deals and new arrivals.",
      icon: Clock,
    },
  ]

  return (
    <section
      id="features"
      className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent py-16 md:py-24"
    >
      <div className="w-full max-w-6xl relative flex flex-col justify-start items-start gap-6">
        {/* Background glow */}
        <div className="w-[547px] h-[938px] absolute top-[400px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />

        {/* Section header */}
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              Why Choose CoupX?
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-base md:text-lg font-medium leading-relaxed">
              Experience the best coupon marketplace with features designed for your convenience and savings.
            </p>
          </div>
        </div>

        {/* Bento grid */}
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {features.map((feature) => (
            <BentoCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
