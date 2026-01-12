import React from 'react';
import { WhatsAppPreview } from './WhatsAppPreview';

/**
 * ExamplesSection Component
 *
 * Seção que demonstra o antes e depois da formatação usando o preview real do WhatsApp.
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
    <section className="container mx-auto px-4 py-24 bg-slate-950">
      {/* Título da seção */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Veja a Diferença Real
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Compare como uma mensagem comum se transforma em uma comunicação profissional e organizada dentro do WhatsApp.
        </p>
      </div>

      {/* Grid de exemplos */}
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
        {/* Lado Esquerdo: Antes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Antes</h3>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <p className="text-slate-400 text-lg leading-relaxed italic">
              "{beforeText}"
            </p>
            <div className="mt-8 pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                Texto simples, sem hierarquia visual e difícil de escanear.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Depois (WhatsApp Preview) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Depois</h3>
          </div>

          <div className="transform lg:scale-105 transition-transform duration-500">
            <WhatsAppPreview text={afterText} />
          </div>
          
          <div className="text-center lg:text-left">
            <p className="text-emerald-400 font-medium flex items-center justify-center lg:justify-start gap-2">
              <span className="text-xl">✨</span>
              Formatado, estruturado e pronto para converter!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamplesSection;
