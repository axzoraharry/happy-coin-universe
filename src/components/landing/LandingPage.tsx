
import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { WhyChooseSection } from './WhyChooseSection';
import { CTASection } from './CTASection';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Hero Section */}
      <HeroSection onGetStarted={onGetStarted} />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Key Features */}
      <WhyChooseSection />

      {/* CTA Section */}
      <CTASection onGetStarted={onGetStarted} />
    </div>
  );
}
