import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';

interface StyleExamplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLES = {
  casual: {
    title: 'Casual',
    subtitle: 'Friendly',
    icon: '😊',
    color: 'emerald',
    examples: [
      {
        title: 'Atendimento ao Cliente',
        before: 'Produto chegou. Pode retirar loja 3.',
        after: 'Oi! 😊 Seu produto já chegou! ✨\n\nPode passar aqui na loja 3 pra retirar quando quiser! Estamos te esperando! 🎉'
      },
      {
        title: 'Confirmação de Reunião',
        before: 'Reunião amanhã 14h sala 2',
        after: 'Oi! 👋 Só lembrando da nossa reunião amanhã às 14h na sala 2! 📅\n\nNos vemos lá! 😊'
      },
      {
        title: 'Aviso de Promoção',
        before: 'Desconto 20% fim semana',
        after: 'Opa! 🎉 Promoção especial pra você!\n\n20% de desconto neste fim de semana! 🛍️\n\nAproveita! 😊'
      }
    ]
  },
  sales: {
    title: 'Sales',
    subtitle: 'Persuasive',
    icon: '🔥',
    color: 'orange',
    examples: [
      {
        title: 'Lançamento de Produto',
        before: 'Novo smartphone. 256GB. R$1999',
        after: '🔥 *LANÇAMENTO EXPLOSIVO!* 🔥\n\n📱 *NOVO SMARTPHONE TOP!*\n💾 256GB de memória\n💰 *R$ 1.999* — PREÇO ESPECIAL!\n\n⚡ *GARANTA O SEU AGORA!*\n✅ Estoque limitado!'
      },
      {
        title: 'Black Friday',
        before: 'Black Friday. Até 70% desconto.',
        after: '🚨 *BLACK FRIDAY CHEGOU!* 🚨\n\n💥 ATÉ *70% DE DESCONTO!* 💥\n🎯 OFERTAS IMPERDÍVEIS!\n⏰ *SÓ HOJE!*\n\n🔥 NÃO PERCA! CORRE!'
      },
      {
        title: 'Última Chance',
        before: 'Promoção acaba hoje',
        after: '⚠️ *ÚLTIMA CHANCE!* ⚠️\n\n🔥 A promoção *ACABA HOJE!*\n⏰ Últimas horas!\n💰 Economia GARANTIDA!\n\n✅ *APROVEITE AGORA!*\n❌ Não deixe pra depois!'
      }
    ]
  },
  announcement: {
    title: 'Official',
    subtitle: 'Announcement',
    icon: '📢',
    color: 'blue',
    examples: [
      {
        title: 'Comunicado Empresarial',
        before: 'Escritório fechado dia 25. Feriado',
        after: '📢 *Comunicado Oficial*\n\n*Expediente:*\n\n• Data: 25 de dezembro\n• Status: Escritório fechado\n• Motivo: Feriado nacional\n\nRetorno: 26 de dezembro\n\nAtenciosamente,\nAdministração'
      },
      {
        title: 'Alteração de Horário',
        before: 'Horário mudou. 8h às 18h seg a sex',
        after: '📢 *Aviso Importante*\n\n*Alteração de Horário de Funcionamento:*\n\n• Segunda a Sexta: 8h às 18h\n• Vigência: Imediata\n\nPor favor, ajustem seus agendamentos.\n\nAtenciosamente,\nGerência'
      },
      {
        title: 'Manutenção Programada',
        before: 'Sistema fora sábado 2h às 6h',
        after: '📢 *Manutenção Programada*\n\n*Informações:*\n\n• Sistema: Plataforma online\n• Data: Sábado\n• Horário: 2h às 6h\n• Status: Indisponível temporariamente\n\nPedimos desculpas pelo transtorno.\n\nEquipe Técnica'
      }
    ]
  }
};

export function StyleExamplesModal({ open, onOpenChange }: StyleExamplesModalProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('casual');

  const handleTryStyle = (styleId: string) => {
    localStorage.setItem('selectedStyle', styleId);
    localStorage.setItem('lastUsedStyle', styleId);
    setLocation('/format');
    onOpenChange(false);
  };

  const currentStyle = EXAMPLES[activeTab as keyof typeof EXAMPLES];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Exemplos de Formatação</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="py-2">
          <div className="flex gap-2 border-b border-slate-700 mb-4">
            {Object.entries(EXAMPLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === key
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="mr-1.5">{style.icon}</span>
                {style.title}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {currentStyle.examples.map((example, index) => (
              <div
                key={index}
                className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30"
              >
                <div className="p-2.5 border-b border-slate-700 bg-slate-800/50">
                  <h4 className="text-sm font-semibold text-slate-200">{example.title}</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-3 p-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">Antes:</p>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700 min-h-[80px]">
                      <p className="text-xs text-slate-300">{example.before}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">Depois:</p>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700 min-h-[80px]">
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{example.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-2">
              <Button
                onClick={() => handleTryStyle(activeTab)}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                Usar {currentStyle.title}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
