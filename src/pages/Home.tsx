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
      {/* 1. Hero Section - Reduzido padding superior */}
      <HeroSection />
      
      {/* 2. Interactive Demo - Layout mais compacto */}
      <div id="formatter" className="container mx-auto px-4 py-4">
        <div className="max-w-5xl mx-auto bg-slate-900/30 rounded-2xl border border-slate-800/50 p-1 shadow-xl">
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

      {/* 3. Features - Reduzido padding vertical */}
      <div className="py-8">
        <FeaturesSection />
      </div>

      {/* 4. Social Proof - Reduzido padding vertical */}
      <div className="py-8">
        <TestimonialsSection />
      </div>

      {/* 5. Examples - Reduzido padding vertical */}
      <ExamplesSection />

      {/* 6. Pricing - Reduzido padding vertical */}
      <div className="py-8">
        <PricingSection />
      </div>

      {/* 7. FAQ - Reduzido padding vertical */}
      <div className="py-8">
        <FAQSection />
      </div>

      {/* Footer Simples */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-900 text-center text-slate-500 text-[10px] uppercase tracking-widest">
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
