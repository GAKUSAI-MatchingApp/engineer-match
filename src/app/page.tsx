import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Faq } from "@/components/sections/Faq";
import { FeaturedOpportunities } from "@/components/sections/FeaturedOpportunities";
import { FinalCta } from "@/components/sections/FinalCta";
import { ForCompanies } from "@/components/sections/ForCompanies";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ItssSection } from "@/components/sections/ItssSection";
import { PopularSkills } from "@/components/sections/PopularSkills";
import { ServiceCategories } from "@/components/sections/ServiceCategories";
import { Statistics } from "@/components/sections/Statistics";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { createClient } from "@/lib/supabase/server";
import { listFeaturedOpportunities } from "@/lib/landing/featured-opportunities";
import { getLandingStats } from "@/lib/landing/stats";

/**
 * Featured jobs are real published opportunities from ACTIVE companies
 * (listFeaturedOpportunities) -- never fabricated data.
 *
 * For a logged-out visitor this legitimately returns zero rows today:
 * opportunities_select_active (024_opportunity_policies.sql) grants SELECT
 * to `authenticated` only, not `anon`. FeaturedOpportunities renders an
 * honest empty state (sign-up CTA) in that case rather than hiding the
 * section or showing placeholder data. Public anonymous browsing is a
 * separately-tracked, deferred decision, not something this fix changes.
 */
export default async function Home() {
  const supabase = await createClient();
  const [featuredOpportunities, stats] = await Promise.all([
    listFeaturedOpportunities(supabase, 6),
    getLandingStats(),
  ]);

  return (
    <>
      <Header />
      <Hero />
      <Statistics stats={stats} />
      <ServiceCategories />
      <PopularSkills />
      <FeaturedOpportunities opportunities={featuredOpportunities} />
      <WhyChooseUs />
      <ItssSection />
      <HowItWorks />
      <ForCompanies />
      <Faq />
      <FinalCta />

      <Footer />
    </>
  );
}
