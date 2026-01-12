import React from 'react';
import { Sparkles, Users, CheckCircle } from 'lucide-react';

/**
 * HeroSection Component - Otimizado para Conversão
 * 
 * Focado em:
 * 1. Headline de Benefício Real (Vendas/Profissionalismo)
 * 2. Subheadline de Solução
 * 3. Prova Social Imediata
 * 4. CTA de Baixo Atrito
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
      {/* Badge de Prova Social / Novidade */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-in">
          <Users className="w-4 h-4" />
          <span>Usado por +1.000 empreendedores e vendedores</span>
        </div>
      </div>

      {/* Título Principal - Focado em Resultado */}
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Transforme Mensagens em Vendas no WhatsApp
        </span>
      </h1>

      {/* Subtítulo - Focado na Dor e Solução */}
      <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
        Pare de perder clientes com mensagens bagunçadas. Use nossa <span className="text-white font-semibold">IA Especialista</span> para criar textos profissionais, persuasivos e perfeitamente formatados em segundos.
      </p>

      {/* CTAs Principais */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <button
          onClick={scrollToFormatter}
          className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Começar Agora - É Grátis
        </button>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Sem cartão de crédito</span>
        </div>
      </div>

      {/* Benefícios Rápidos */}
      <div className="flex flex-wrap justify-center gap-8 text-slate-500 text-sm border-t border-slate-800/50 pt-12">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">100%</span> Otimizado para WhatsApp
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">IA</span> de Última Geração
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">30</span> Créditos Grátis/Mês
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
