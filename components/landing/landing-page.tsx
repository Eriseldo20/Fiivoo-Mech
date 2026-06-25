import { LandingNav } from "./landing-nav"
import { LandingHero } from "./landing-hero"
import { LandingStats } from "./landing-stats"
import { LandingFeatures } from "./landing-features"
import { LandingProduct } from "./landing-product"
import { LandingPricing } from "./landing-pricing"
import { LandingFaq } from "./landing-faq"
import { LandingCta } from "./landing-cta"
import { LandingFooter } from "./landing-footer"

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[oklch(0.22_0.03_262)]">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingProduct />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
