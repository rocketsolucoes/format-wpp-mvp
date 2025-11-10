import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { useLocation } from 'wouter';

interface StyleComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_TEXT = "Notebook disponível. Core i7, 16GB RAM. R$ 2.800";

const STYLE_COMPARISONS = [
  {
    id: 'casual',
    title: 'Casual',
    subtitle: 'Friendly',
    icon: '😊',
    color: 'emerald',
    example: '📱 Oi! Olha que oferta legal! 😊\n\nNotebook com Core i7 e 16GB de RAM por apenas R$ 2.800! 💻✨\n\nTá disponível! Me chama se tiver interesse! 👍'
  },
  {
    id: 'sales',
    title: 'Sales',
    subtitle: 'Persuasive',
    icon: '🔥',
    color: 'orange',
    example: '🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n💻 *NOTEBOOK CORE i7* 💻\n📊 16GB RAM — PERFORMANCE MÁXIMA!\n💰 *R$ 2.800* → PREÇO IMBATÍVEL!\n\n⚡ *CORRE!* Unidades limitadas!\n✅ Aproveite AGORA!'
  },
  {
    id: 'announcement',
    title: 'Official',
    subtitle: 'Announcement',
    icon: '📢',
    color: 'blue',
    example: '📢 *Aviso Importante*\n\n*Disponibilidade de Produto:*\n\n• Equipamento: Notebook\n• Processador: Intel Core i7\n• Memória RAM: 16GB\n• Valor: R$ 2.800,00\n\nProduto disponível para aquisição imediata.\n\nPara mais informações, entre em contato.'
  }
];

export function StyleComparisonModal({ open, onOpenChange }: StyleComparisonModalProps) {
  const [, setLocation] = useLocation();

  const handleUseStyle = (styleId: string) => {
    localStorage.setItem('selectedStyle', styleId);
    localStorage.setItem('lastUsedStyle', styleId);
    setLocation('/format');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparação de Estilos</DialogTitle>
          <p className="text-sm text-slate-400 mt-2">
            Veja como cada estilo formata o mesmo texto:
          </p>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 mb-2">Texto Original:</p>
            <p className="text-sm text-slate-200">{SAMPLE_TEXT}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STYLE_COMPARISONS.map((style) => (
              <div
                key={style.id}
                className="flex flex-col border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 hover:border-slate-600 transition-colors"
              >
                <div className={`p-4 border-b border-slate-700 bg-${style.color}-500/5`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-200">{style.title}</h3>
                      <p className="text-xs text-slate-400">{style.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="mb-4 min-h-[200px]">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Resultado:</p>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-slate-700">
                      {style.example}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUseStyle(style.id)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    Usar Este Estilo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
