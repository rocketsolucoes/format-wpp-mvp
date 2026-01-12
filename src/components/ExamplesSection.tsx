import React from 'react';
import { WhatsAppPreview } from './WhatsAppPreview';

/**
 * ExamplesSection Component - Compacto
 */
const ExamplesSection: React.FC = () => {
  const beforeText = `Oi pessoal, só queria lembrar todos sobre a reunião de amanhã às 10h. Por favor, tragam suas atualizações do projeto. Além disso, não esqueçam de revisar o documento de metas do Q4 que enviei na semana passada. Ansioso para ver todos lá!`;

  const afterText = `*Oi pessoal!* 👋

Apenas um lembrete amigável sobre a *reunião de amanhã*:

⏰ *Horário:* 10h
📋 *Por favor tragam:* Suas atualizações do projeto

_Não esqueçam_ de revisar o documento de *metas Q4* que enviei na semana passada.

Ansioso para ver todos lá! 🚀`;

  return (
    <section className="container mx-auto px-4 py-12 bg-background">
      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-center">
        {/* Lado Esquerdo: Antes */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Antes</h3>
          </div>
          
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <p className="text-muted-foreground text-base leading-relaxed italic">
              "{beforeText}"
            </p>
          </div>
          
          <div className="hidden lg:block p-4 border-l-2 border-emerald-500/30 bg-emerald-500/5">
            <p className="text-sm text-muted-foreground font-medium">
              "A diferença entre uma mensagem ignorada e uma mensagem lida está na clareza visual."
            </p>
          </div>
        </div>

        {/* Lado Direito: Depois (WhatsApp Preview) */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-500 border border-emerald-400 w-fit shadow-lg">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Depois</h3>
          </div>

          <div className="transform scale-90 lg:scale-95 origin-top">
            <WhatsAppPreview text={afterText} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamplesSection;
