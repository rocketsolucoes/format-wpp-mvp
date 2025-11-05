import React from 'react';

/**
 * ExamplesSection Component
 *
 * Seção que demonstra o antes e depois da formatação.
 * Layout em grid com 2 cards lado a lado (responsivo).
 *
 * - Card "Before": Texto sem formatação (destaque vermelho)
 * - Card "After": Texto formatado (destaque verde)
 */
const ExamplesSection: React.FC = () => {
  /**
   * Exemplo de texto antes da formatação
   */
  const beforeText = `Hi team, just wanted to remind everyone about tomorrow's meeting at 10am. Please bring your project updates. Also, don't forget to review the Q4 goals document I sent last week. Looking forward to seeing everyone there!`;

  /**
   * Exemplo de texto após formatação
   * Usa a sintaxe de formatação do WhatsApp
   */
  const afterText = `*Hi team!* 👋

Just a friendly reminder about *tomorrow's meeting*:

⏰ *Time:* 10 AM
📋 *Please bring:* Your project updates

_Don't forget_ to review the *Q4 goals* document I sent last week.

Looking forward to seeing everyone there! 🚀`;

  return (
    <section className="container mx-auto px-4 py-16 bg-slate-900/30">
      {/* Título da seção */}
      <h2 className="text-3xl font-bold text-center mb-4 text-slate-100">
        See the Difference
      </h2>

      {/* Subtítulo */}
      <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
        Watch how ordinary messages transform into engaging, professional communications
      </p>

      {/* Grid de exemplos - responsivo */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Card BEFORE - Texto sem formatação */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          {/* Header com destaque vermelho */}
          <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
              Before
            </h3>
          </div>

          {/* Conteúdo do exemplo */}
          <div className="p-6">
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {beforeText}
            </p>
          </div>

          {/* Footer com descrição */}
          <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Plain, unformatted text - hard to read and unprofessional
            </p>
          </div>
        </div>

        {/* Card AFTER - Texto formatado */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden shadow-lg shadow-emerald-500/10">
          {/* Header com destaque verde */}
          <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
              After
            </h3>
          </div>

          {/* Conteúdo do exemplo */}
          <div className="p-6">
            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
              {afterText}
            </p>
          </div>

          {/* Footer com descrição */}
          <div className="px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/20">
            <p className="text-xs text-emerald-400">
              Formatted, structured, and professional - ready to impress!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamplesSection;
