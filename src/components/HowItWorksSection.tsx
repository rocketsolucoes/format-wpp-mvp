import React from 'react';
import { FileText, Wand2, Copy } from 'lucide-react';

interface Step {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}

const HowItWorksSection: React.FC = () => {
  const steps: Step[] = [
    {
      icon: <FileText className="w-8 h-8 text-primary" />,
      number: '01',
      title: 'Cole seu texto',
      description: 'Copie e cole a mensagem que você quer enviar no WhatsApp. Pode ser qualquer texto: oferta, comunicado, aviso.'
    },
    {
      icon: <Wand2 className="w-8 h-8 text-primary" />,
      number: '02',
      title: 'Escolha o estilo',
      description: 'Selecione entre Casual, Sales ou Official. Nossa IA aplica a formatação ideal para cada objetivo.'
    },
    {
      icon: <Copy className="w-8 h-8 text-primary" />,
      number: '03',
      title: 'Copie formatado',
      description: 'Pronto! Sua mensagem está perfeitamente formatada com negrito, itálico e listas. É só colar no WhatsApp.'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Como Funciona?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transforme suas mensagens em 3 passos simples. Sem complicação, sem curva de aprendizado.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {/* Número do passo */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 border-2 border-primary rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{step.number}</span>
            </div>

            {/* Ícone */}
            <div className="mb-6 p-4 bg-primary/10 rounded-xl w-fit">
              {step.icon}
            </div>

            {/* Título */}
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {step.title}
            </h3>

            {/* Descrição */}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>

            {/* Linha conectora (apenas para os dois primeiros) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
            )}
          </div>
        ))}
      </div>

      {/* CTA opcional */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground text-sm">
          Simples assim. <span className="text-primary font-semibold">Experimente agora gratuitamente!</span>
        </p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
