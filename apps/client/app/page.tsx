import type { Metadata } from "next";
import "./marketing.css";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { ProductOverview } from "@/components/marketing/ProductOverview";
import { TransportSection } from "@/components/marketing/TransportSection";
import { TemplateDesignerShowcase } from "@/components/marketing/TemplateDesignerShowcase";
import { AudienceSection } from "@/components/marketing/AudienceSection";
import { CampaignSection } from "@/components/marketing/CampaignSection";
import { TrackingSection } from "@/components/marketing/TrackingSection";
import { OwnershipSection } from "@/components/marketing/OwnershipSection";
import { WorkflowSection } from "@/components/marketing/WorkflowSection";
import { UseCasesSection } from "@/components/marketing/UseCasesSection";
import { DeveloperSection } from "@/components/marketing/DeveloperSection";
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
      {/* 01. Navigation */}
      <MarketingNav />

      <main id="marketing-content">
        {/* 02. Hero Section */}
        <HeroSection />

        {/* 03. Problem Statement */}
        <ProblemSection />

        {/* 04. Product Introduction (4 Pillars) */}
        <ProductOverview />

        {/* 05. Transport Management */}
        <TransportSection />

        {/* 06. Visual Template Designer (Centerpiece) */}
        <TemplateDesignerShowcase />

        {/* 07. Audience Management */}
        <AudienceSection />

        {/* 08. Campaign Creation & Idempotent Sending */}
        <CampaignSection />

        {/* 09. Delivery Tracking & Real-Time Telemetry */}
        <TrackingSection />

        {/* 10. Infrastructure & Ownership */}
        <OwnershipSection />

        {/* 11. How It Works (4-Step Lifecycle) */}
        <WorkflowSection />

        {/* 12. Use Cases */}
        <UseCasesSection />

        {/* 13. Developer Architecture & Fault Tolerance */}
        <DeveloperSection />

        {/* 14. FAQ Accordion */}
        <FAQSection />

        {/* 15. Final Call-to-Action */}
        <FinalCTA />
      </main>

      {/* 16. Footer */}
      <MarketingFooter />
    </div>
  );
}
