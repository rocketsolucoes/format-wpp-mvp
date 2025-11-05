import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import HeroSection from '../components/HeroSection';
import FormatterInterface from '../components/FormatterInterface';
import FeaturesSection from '../components/FeaturesSection';
import ExamplesSection from '../components/ExamplesSection';
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
    <div>
      <HeroSection />
      <FormatterInterface
        onNoCredits={handleNoCredits}
        onFormatSuccess={(credits) => {
          if (credits === 0) {
            handleNoCredits();
          }
        }}
      />
      <FeaturesSection />
      <ExamplesSection />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Home;
