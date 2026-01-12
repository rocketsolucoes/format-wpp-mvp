import React from 'react';
import { Zap, MessageCircle, TrendingUp } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeaturesSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: 'Super Rápido',
      description: 'Formate suas mensagens em segundos com nosso mecanismo movido a IA. Chega de dificuldades com formatação manual.'
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-primary" />,
      title: 'Otimizado para WhatsApp',
      description: 'Especialmente projetado para formatação do WhatsApp. Usa negrito, itálico, tachado e monoespaçado perfeitamente.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: 'Impacto Profissional',
      description: 'Faça suas mensagens se destacarem. Perfeito para comunicação empresarial, marketing e marca pessoal.'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
        Por que Usar o ZapStyle?
      </h2>

      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Transforme texto simples em mensagens profissionais e envolventes do WhatsApp que capturam atenção
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm hover:shadow-primary/10 transition-all duration-300 hover:scale-105"
          >
            <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
              {feature.icon}
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {feature.title}
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
