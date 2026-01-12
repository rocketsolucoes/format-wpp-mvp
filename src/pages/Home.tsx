import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import HeroSection from '../components/HeroSection';
import FormatterInterface from '../components/FormatterInterface';
import FeaturesSection from '../components/FeaturesSection';
import ExamplesSection from '../components/ExamplesSection';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import FAQSection from '../components/FAQSection';
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
    <div className="bg-slate-950 min-h-screen text-slate-100 selection:bg-emerald-500/30">
      {/* 1. Hero Section - Foco em Conversão */}
      <HeroSection />
      
      {/* 2. Interactive Demo - Valor Imediato */}
      <div id="formatter" className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto bg-slate-900/50 rounded-3xl border border-slate-800 p-1 shadow-2xl">
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

      {/* 3. Features - Benefícios Reais */}
      <FeaturesSection />

      {/* 4. Social Proof - Depoimentos */}
      <TestimonialsSection />

      {/* 5. Examples - Casos de Uso */}
      <ExamplesSection />

      {/* 6. Pricing - Conversão Final */}
      <PricingSection />

      {/* 7. FAQ - Quebra de Objeções */}
      <FAQSection />

      {/* Footer Simples */}
      <footer className="container mx-auto px-4 py-12 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>© 2026 Format App. Todos os direitos reservados.</p>
      </footer>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Home;
