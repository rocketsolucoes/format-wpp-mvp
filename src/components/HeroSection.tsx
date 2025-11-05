import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * HeroSection Component
 *
 * Seção de apresentação inicial da aplicação.
 * Inclui:
 * - Título principal com efeito gradiente
 * - Subtítulo descritivo
 * - Botão de Call-to-Action que rola até a interface
 */
const HeroSection: React.FC = () => {
  /**
   * Função para rolar suavemente até a seção do formatador
   */
  const scrollToFormatter = () => {
    const formatterSection = document.getElementById('formatter');
    if (formatterSection) {
      formatterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="container mx-auto px-4 py-20 text-center">
      {/* Ícone decorativo */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Título principal com gradiente */}
      <h1 className="text-5xl md:text-6xl font-bold mb-6">
        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          WhatsApp Magic Formatter
        </span>
      </h1>

      {/* Subtítulo descritivo */}
      <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
        Transform your plain WhatsApp messages into beautifully formatted, professional text with the power of AI.
        Stand out in every conversation.
      </p>

      {/* Call-to-Action Button */}
      <button
        onClick={scrollToFormatter}
        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
      >
        Try It Now - It's Free!
      </button>
    </section>
  );
};

export default HeroSection;
