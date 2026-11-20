import type { Metadata } from "next";
import "./marketing.css";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProductOverview } from "@/components/marketing/ProductOverview";
import { TemplateDesignerShowcase } from "@/components/marketing/TemplateDesignerShowcase";
import { FAQSection } from "@/components/marketing/FAQSection";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Patra · Self-Hosted Email Infrastructure & Campaign Management",
  description:
    "Design beautiful emails, manage your audience, launch campaigns and track every delivery. All through one flexible, self-hostable platform.",
  openGraph: {
    title: "Patra · Self-Hosted Email Infrastructure & Campaign Management",
    description:
      "Design beautiful emails, manage your audience, launch campaigns and track every delivery. All through one flexible, self-hostable platform.",
    url: "https://patra.dev",
    siteName: "Patra",
    type: "website",
  },
};

export default function MarketingPage() {
  return (
    <div className="patra-marketing min-h-screen selection:bg-[#0755B5] selection:text-[#F4F2E8]">
      {/* 01. Minimalist Navigation */}
      <MarketingNav />

      <main id="marketing-content">
        {/* 02. Flipped Minimalist Hero Section (Cream + Blue) */}
        <HeroSection />

        {/* 03. Core Capabilities (4 Pillars Grid) */}
        <ProductOverview />

        {/* 04. Visual Template Designer Showcase */}
        <TemplateDesignerShowcase />

        {/* 05. Frequently Asked Questions */}
        <FAQSection />

        {/* 06. Final Minimalist Call-to-Action */}
        <FinalCTA />
      </main>

      {/* 07. Minimalist Footer */}
      <MarketingFooter />
    </div>
  );
}
