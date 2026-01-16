import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

const CTASection: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleStartFree = () => {
    setLocation('/auth?tab=signup');
  };
  
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      setLocation('/pricing');
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-3xl p-12 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>🎁 Ganhe 7 Dias de Pro Grátis</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Pronto para Testar Todos os Recursos Pro?
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Crie sua conta agora e ganhe acesso completo por 7 dias: créditos ilimitados, estilos profissionais, histórico completo e análises avançadas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartFree}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 border-0"
          >
            Ativar Meu Trial Grátis
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={scrollToPricing}
            className="w-full sm:w-auto px-8 py-4 bg-background border-2 border-border text-foreground rounded-xl font-bold text-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
          >
            Ver Planos
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          ✓ Sem cartão de crédito • ✓ Trial Pro de 7 dias • ✓ Sem compromisso
        </p>
      </div>
    </section>
  );
};

export default CTASection;
