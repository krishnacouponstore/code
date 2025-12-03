import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "CodeCrate has saved me thousands of rupees! The coupons are always valid and the delivery is instant. Best coupon platform I've used.",
    name: "Rahul Sharma",
    role: "Regular Buyer",
    rating: 5,
    highlight: true,
  },
  {
    quote: "Finally found a reliable source for premium coupons. The wallet system makes purchasing so convenient.",
    name: "Priya Patel",
    role: "Business Owner",
    rating: 5,
  },
  {
    quote: "Customer support is exceptional. Had a small issue and it was resolved within minutes via Telegram.",
    name: "Amit Kumar",
    role: "Frequent Shopper",
    rating: 5,
  },
  {
    quote: "The bulk download feature is a game changer for my business. Highly recommend for resellers!",
    name: "Sneha Gupta",
    role: "Reseller",
    rating: 5,
  },
  {
    quote: "I've been using CodeCrate for 6 months now. Never had a single invalid coupon. Truly reliable!",
    name: "Vikram Singh",
    role: "Tech Enthusiast",
    rating: 5,
  },
  {
    quote: "The interface is so clean and easy to use. Found exactly what I needed in seconds.",
    name: "Anita Desai",
    role: "First-time Buyer",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full px-5 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-foreground text-3xl md:text-5xl font-semibold mb-4">Loved by Thousands</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            See what our customers have to say about their experience with CodeCrate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl ${
                testimonial.highlight
                  ? "bg-primary text-primary-foreground md:col-span-2 lg:col-span-1"
                  : "bg-card border border-border"
              }`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 fill-current ${testimonial.highlight ? "text-primary-foreground" : "text-primary"}`}
                  />
                ))}
              </div>
              <p className={`text-base mb-6 leading-relaxed ${testimonial.highlight ? "" : "text-foreground/80"}`}>
                "{testimonial.quote}"
              </p>
              <div>
                <p className={`font-medium ${testimonial.highlight ? "" : "text-foreground"}`}>{testimonial.name}</p>
                <p
                  className={`text-sm ${testimonial.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
