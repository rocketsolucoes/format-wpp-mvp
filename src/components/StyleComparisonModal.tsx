import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';
import { WhatsAppPreviewCompact } from './WhatsAppPreviewCompact';

interface StyleComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_TEXT = "Notebook disponível. Core i7, 16GB RAM. R$ 2.800";

const STYLE_COMPARISONS = [
  {
    id: 'casual',
    title: 'Casual',
    subtitle: 'Amigável',
    icon: '😊',
    color: 'emerald',
    example: '📱 Oi! Olha que oferta legal! 😊\n\nNotebook com Core i7 e 16GB de RAM por apenas R$ 2.800! 💻✨\n\nTá disponível! Me chama se tiver interesse! 👍'
  },
  {
    id: 'sales',
    title: 'Sales',
    subtitle: 'Persuasivo',
    icon: '🔥',
    color: 'orange',
    example: '🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n💻 *NOTEBOOK CORE i7* 💻\n📊 16GB RAM — PERFORMANCE MÁXIMA!\n💰 *R$ 2.800* → PREÇO IMBATÍVEL!\n\n⚡ *CORRE!* Unidades limitadas!\n✅ Aproveite AGORA!'
  },
  {
    id: 'announcement',
    title: 'Official',
    subtitle: 'Anúncio',
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
      <DialogContent className="max-w-6xl mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Comparação de Estilos</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="py-4 max-h-[75vh] overflow-y-auto px-6">
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Texto Original:</p>
            <p className="text-base text-foreground">{SAMPLE_TEXT}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STYLE_COMPARISONS.map((style) => (
              <div
                key={style.id}
                className="flex flex-col border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
              >
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{style.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{style.title}</h3>
                      <p className="text-xs text-muted-foreground">{style.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Como aparece no WhatsApp:</p>
                    <div className="max-h-[300px] overflow-y-auto">
                      <WhatsAppPreviewCompact text={style.example} />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUseStyle(style.id)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    Usar Estilo
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
