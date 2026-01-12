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

      {/* 3. Features - Mostra O QUE o sistema faz */}
      <div id="features" className="py-8">
        <FeaturesSection />
      </div>

      {/* 4. How It Works - Mostra COMO funciona (3 passos) */}
      <div id="how-it-works" className="py-8">
        <HowItWorksSection />
      </div>

      {/* 5. Examples - Mostra o RESULTADO (Antes vs Depois) */}
      <div id="examples" className="py-8">
        <ExamplesSection />
      </div>

      {/* 6. Interactive Demo - AGORA o usuário testa com contexto */}
      <div id="formatter" className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experimente Agora Gratuitamente
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cole sua mensagem abaixo e veja a mágica acontecer. Sem cadastro, sem cartão de crédito.
          </p>
        </div>
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

      {/* 7. Testimonials - Social Proof após o usuário testar */}
      <div className="py-8">
        <TestimonialsSection />
      </div>

      {/* 8. Stats - Números de Impacto */}
      <div className="py-8">
        <StatsSection />
      </div>

      {/* 9. Pricing */}
      <div id="pricing" className="py-8">
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
