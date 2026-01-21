import React from 'react';
import { Sparkles, Users, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { trackEvent } from '../hooks/useAnalytics';

const HeroSection: React.FC = () => {
  const [, setLocation] = useLocation();
  
  const handleStartFree = () => {
    trackEvent('cta_click', {
      cta_location: 'hero',
      cta_text: 'Ganhar 7 Dias de Pro Grátis',
      event_category: 'engagement',
      event_label: 'hero_trial_button'
    });
    setLocation('/auth?tab=signup');
  };

  return (
    <section className="container mx-auto px-4 pt-20 pb-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
          <Users className="w-4 h-4" />
          <span>Usado por +1.000 empreendedores e vendedores</span>
        </div>
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
        <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
          Estilize suas Mensagens para WhatsApp com IA
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
        Transforme seus textos brutos em mensagens <span className="text-foreground font-semibold">perfeitamente formatadas</span>. Nossa IA aplica negrito, itálico e listas de forma estratégica para aumentar sua clareza e profissionalismo.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <button
          onClick={handleStartFree}
          className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 border-0"
        >
          <Sparkles className="w-5 h-5" />
          Ganhar 7 Dias de Pro Grátis
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Sem cartão de crédito</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Trial completo por 7 dias</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
