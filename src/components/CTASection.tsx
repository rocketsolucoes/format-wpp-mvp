import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

const CTASection: React.FC = () => {
  const [, setLocation] = useLocation();

  const scrollToFormatter = () => {
    const formatterSection = document.getElementById('formatter');
    if (formatterSection) {
      formatterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-3xl p-12 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Comece Gratuitamente Hoje</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Pronto para Transformar suas Mensagens?
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de profissionais que já economizam tempo e aumentam o impacto de suas comunicações no WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={scrollToFormatter}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            Experimentar Grátis Agora
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setLocation('/pricing')}
            className="w-full sm:w-auto px-8 py-4 bg-background border-2 border-border text-foreground rounded-xl font-bold text-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
          >
            Ver Planos
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          ✓ Sem cartão de crédito • ✓ 30 créditos grátis • ✓ Cancele quando quiser
        </p>
      </div>
    </section>
  );
};

export default CTASection;
