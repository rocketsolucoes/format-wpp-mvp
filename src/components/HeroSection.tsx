import React from 'react';
import { Sparkles, Users, CheckCircle } from 'lucide-react';

/**
 * HeroSection Component - Ajustado para Formatação/Estilização
 */
const HeroSection: React.FC = () => {
  const scrollToFormatter = () => {
    const formatterSection = document.getElementById('formatter');
    if (formatterSection) {
      formatterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="container mx-auto px-4 pt-20 pb-16 text-center">
      {/* Badge de Prova Social */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-in">
          <Users className="w-4 h-4" />
          <span>Usado por +1.000 empreendedores e vendedores</span>
        </div>
      </div>

      {/* Título Principal - Focado em Estilização/Formatação */}
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Estilize suas Mensagens para WhatsApp com IA
        </span>
      </h1>

      {/* Subtítulo - Focado em Formatação Inteligente */}
      <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
        Transforme seus textos brutos em mensagens <span className="text-white font-semibold">perfeitamente formatadas</span>. Nossa IA aplica negrito, itálico e listas de forma estratégica para aumentar sua clareza e profissionalismo.
      </p>

      {/* CTAs Principais */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <button
          onClick={scrollToFormatter}
          className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Formatar Agora - É Grátis
        </button>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Sem cartão de crédito</span>
        </div>
      </div>

      {/* Benefícios Rápidos */}
      <div className="flex flex-wrap justify-center gap-8 text-slate-500 text-sm border-t border-slate-800/50 pt-12">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Negrito & Itálico</span> Automáticos
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">IA</span> de Estilização
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">30</span> Créditos Grátis/Mês
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
