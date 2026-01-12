import React from 'react';
import { Sparkles, Users, CheckCircle } from 'lucide-react';

const HeroSection: React.FC = () => {
  const scrollToFormatter = () => {
    const formatterSection = document.getElementById('formatter');
    if (formatterSection) {
      formatterSection.scrollIntoView({ behavior: 'smooth' });
    }
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
          onClick={scrollToFormatter}
          className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Formatar Agora - É Grátis
        </button>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span>Sem cartão de crédito</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm border-t border-border pt-12">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">Negrito & Itálico</span> Automáticos
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">IA</span> de Estilização
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">30</span> Créditos Grátis/Mês
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
