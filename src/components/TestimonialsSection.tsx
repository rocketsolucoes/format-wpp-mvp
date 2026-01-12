import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "Minhas vendas no WhatsApp aumentaram 40% depois que comecei a usar o ZapStyle. As mensagens profissionais passam muito mais confiança.",
    name: "Ricardo Santos",
    role: "Corretor de Imóveis",
    avatar: "RS"
  },
  {
    quote: "Economizo pelo menos 30 minutos por dia não tendo que formatar manualmente cada aviso para meus alunos. A IA é impressionante.",
    name: "Juliana Costa",
    role: "Professora Particular",
    avatar: "JC"
  },
  {
    quote: "O estilo 'Sales' é matador. Consigo criar ofertas irresistíveis em segundos. Vale cada centavo do plano Pro.",
    name: "Marcos Oliveira",
    role: "Empreendedor Digital",
    avatar: "MO"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-24 bg-muted/30">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">O que dizem nossos usuários</h2>
        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-card text-card-foreground border border-border p-8 rounded-2xl relative shadow-sm">
            <Quote className="absolute top-4 right-4 w-8 h-8 text-muted/20" />
            <p className="text-muted-foreground mb-6 italic leading-relaxed">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {t.avatar}
              </div>
              <div>
                <h4 className="font-semibold">{t.name}</h4>
                <p className="text-muted-foreground text-sm">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
