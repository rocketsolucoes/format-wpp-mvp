import React, { useState } from 'react';
import { Link } from 'wouter';
import { Copy, Eye, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { toast } from './ui/Toaster';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from './ui/Dialog';

interface FormattingItem {
  id: string;
  input_text: string;
  output_text: string;
  created_at: string;
  style_id?: string;
}

interface RecentFormattingProps {
  items: FormattingItem[];
  loading: boolean;
}

export function RecentFormatting({ items, loading }: RecentFormattingProps) {
  const [selectedItem, setSelectedItem] = useState<FormattingItem | null>(null);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Formatações Recentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-800/30 rounded-lg space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Formatações Recentes</CardTitle>
            <Link href="/history">
              <a className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                Ver Tudo
              </a>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Nenhuma formatação ainda. Comece a formatar!</p>
              <Link href="/">
                <Button variant="primary" className="text-sm">
                  Formatar Texto Agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors border border-slate-800 hover:border-slate-700 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate mb-2">
                        {item.input_text.substring(0, 80)}
                        {item.input_text.length > 80 && '...'}
                      </p>
                      <span className="text-xs text-slate-500">
                        {getRelativeTime(item.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleCopy(item.output_text, e)}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent>
            <DialogHeader onClose={() => setSelectedItem(null)}>
              <DialogTitle>Detalhes da Formatação</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Texto Original:</h4>
                <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                  {selectedItem.input_text}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Texto Formatado:</h4>
                <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                  {selectedItem.output_text}
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedItem.output_text, {} as any)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Formatado
              </Button>
              <Button onClick={() => setSelectedItem(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
