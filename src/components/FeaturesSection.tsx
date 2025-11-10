import React from 'react';
import { Zap, MessageCircle, TrendingUp } from 'lucide-react';

/**
 * Tipo para definir uma feature
 */
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * FeaturesSection Component
 *
 * Seção que exibe os principais benefícios da ferramenta.
 * Layout em grid responsivo com 3 cards.
 *
 * Cada card inclui:
 * - Ícone representativo
 * - Título da funcionalidade
 * - Descrição do benefício
 */
const FeaturesSection: React.FC = () => {
  /**
   * Array de features da aplicação
   */
  const features: Feature[] = [
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: 'Super Rápido',
      description: 'Formate suas mensagens em segundos com nosso mecanismo movido a IA. Chega de dificuldades com formatação manual.'
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-cyan-400" />,
      title: 'Otimizado para WhatsApp',
      description: 'Especialmente projetado para formatação do WhatsApp. Usa negrito, itálico, tachado e monoespaçado perfeitamente.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      title: 'Impacto Profissional',
      description: 'Faça suas mensagens se destacarem. Perfeito para comunicação empresarial, marketing e marca pessoal.'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      {/* Título da seção */}
      <h2 className="text-3xl font-bold text-center mb-4 text-slate-100">
        Por que Usar o Magic Formatter?
      </h2>

      {/* Subtítulo */}
      <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
        Transforme texto simples em mensagens profissionais e envolventes do WhatsApp que capturam atenção
      </p>

      {/* Grid de features - responsivo */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-105"
          >
            {/* Container do ícone com background gradiente */}
            <div className="mb-4 p-3 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-lg w-fit">
              {feature.icon}
            </div>

            {/* Título da feature */}
            <h3 className="text-xl font-semibold mb-2 text-slate-100">
              {feature.title}
            </h3>

            {/* Descrição da feature */}
            <p className="text-slate-400 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
