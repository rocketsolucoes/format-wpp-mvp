import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import HeroSection from '../components/HeroSection';
import TrustBadges from '../components/TrustBadges';
import FormatterInterface from '../components/FormatterInterface';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ExamplesSection from '../components/ExamplesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import StatsSection from '../components/StatsSection';
import PricingSection from '../components/PricingSection';
import CTASection from '../components/CTASection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import { UpgradeModal } from '../components/UpgradeModal';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handleNoCredits = () => {
    const hideModal = localStorage.getItem('hideUpgradeModal') === 'true';
    if (!hideModal) {
      setShowUpgradeModal(true);
    }
  };

  const handleUpgrade = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-emerald-500/30">
      {/* 1. Hero Section */}
      <HeroSection />
      
      {/* 2. Trust Badges - Logo após o Hero */}
      <div className="container mx-auto px-4">
        <TrustBadges />
      </div>
      
      {/* 3. Interactive Demo */}
      <div id="formatter" className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto bg-card/30 rounded-2xl border border-border/50 p-1 shadow-xl">
          <FormatterInterface
            onNoCredits={handleNoCredits}
            onFormatSuccess={(credits) => {
              if (credits === 0) {
                handleNoCredits();
              }
            }}
          />
        </div>
      </div>

      {/* 4. Features */}
      <div id="features" className="py-8">
        <FeaturesSection />
      </div>

      {/* 5. How It Works - Nova seção */}
      <div id="how-it-works" className="py-8">
        <HowItWorksSection />
      </div>

      {/* 6. Examples - Antes vs Depois */}
      <div id="examples" className="py-8">
        <ExamplesSection />
      </div>

      {/* 7. Testimonials - Social Proof */}
      <div className="py-8">
        <TestimonialsSection />
      </div>

      {/* 8. Stats - Números de Impacto */}
      <div className="py-8">
        <StatsSection />
      </div>

      {/* 9. Pricing */}
      <div className="py-8">
        <PricingSection />
      </div>

      {/* 10. CTA Intermediário - Antes do FAQ */}
      <div className="py-8">
        <CTASection />
      </div>

      {/* 11. FAQ */}
      <div id="faq" className="py-8">
        <FAQSection />
      </div>

      {/* 12. Footer Expandido */}
      <Footer />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Home;
