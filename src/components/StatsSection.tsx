import React from 'react';
import { Users, MessageSquare, Star, Clock } from 'lucide-react';

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatsSection: React.FC = () => {
  const stats: Stat[] = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      value: '1.000+',
      label: 'Usuários Ativos'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      value: '50.000+',
      label: 'Mensagens Formatadas'
    },
    {
      icon: <Star className="w-8 h-8 text-primary" />,
      value: '4.8/5.0',
      label: 'Avaliação Média'
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      value: '30min',
      label: 'Economizados por Dia'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Resultados que Falam por Si
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Milhares de profissionais já transformaram suas comunicações no WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {/* Ícone */}
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  {stat.icon}
                </div>
              </div>

              {/* Valor */}
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
