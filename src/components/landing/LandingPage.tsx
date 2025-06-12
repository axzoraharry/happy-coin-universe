
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { BenefitsSection } from './BenefitsSection';
import { CTASection } from './CTASection';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <BenefitsSection onGetStarted={onGetStarted} />
      <CTASection onGetStarted={onGetStarted} />
    </div>
  );
}
