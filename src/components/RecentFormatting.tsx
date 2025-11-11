import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Copy, Eye, FileText, RefreshCw, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { ScrollArea } from './ui/ScrollArea';
import { toast } from './ui/Toaster';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from './ui/Dialog';
import { supabase } from '../lib/supabase';

interface FormattingItem {
  id: string;
  input_text: string;
  output_text: string;
  created_at: string;
  style_id?: string;
  is_favorite?: boolean;
}

interface RecentFormattingProps {
  items: FormattingItem[];
  loading: boolean;
  onRefresh?: () => void;
  totalCount?: number;
}

interface StyleBadgeConfig {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const STYLE_CONFIGS: Record<string, StyleBadgeConfig> = {
  casual: {
    label: 'Casual',
    icon: '😊',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  sales: {
    label: 'Sales',
    icon: '🔥',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
  },
  announcement: {
    label: 'Official',
    icon: '📢',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
};

function StyleBadge({ styleId }: { styleId?: string }) {
  if (!styleId) return null;

  const config = STYLE_CONFIGS[styleId];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function RecentFormatting({ items, loading, onRefresh, totalCount }: RecentFormattingProps) {
  const [, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState<FormattingItem | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<FormattingItem[]>(items);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return '1 dia atrás';
    if (diffDays < 30) return `${diffDays} dias atrás`;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getCharacterChange = (inputText: string, outputText: string) => {
    const inputLength = inputText.length;
    const outputLength = outputText.length;
    const diff = outputLength - inputLength;

    if (diff > 0) {
      return `${inputLength} → ${outputLength} chars (+${diff})`;
    } else if (diff < 0) {
      return `${inputLength} → ${outputLength} chars (${diff})`;
    }
    return `${inputLength} chars`;
  };

  const handleCopy = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      toast.error('Falha ao copiar');
    }
  };

  const handleView = (item: FormattingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
  };

  const handleReformat = (item: FormattingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('reformat_text', item.input_text);
    localStorage.setItem('reformat_style', item.style_id || 'casual');
    setLocation('/format');
    toast.success('Texto carregado para reformatação');
  };

  const handleToggleFavorite = async (item: FormattingItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (favoriteLoading === item.id) return;

    setFavoriteLoading(item.id);
    const newFavoriteState = !item.is_favorite;

    setLocalItems(prevItems =>
      prevItems.map(i =>
        i.id === item.id ? { ...i, is_favorite: newFavoriteState } : i
      )
    );

    try {
      const { error } = await supabase
        .from('formatting_history')
        .update({ is_favorite: newFavoriteState })
        .eq('id', item.id);

      if (error) throw error;

      if (newFavoriteState) {
        toast.success('Adicionado aos favoritos ⭐', { icon: '⭐', duration: 2000 });
      } else {
        toast.success('Removido dos favoritos', { icon: '❌', duration: 2000 });
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito', { icon: '⚠️', duration: 3000 });

      setLocalItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, is_favorite: !newFavoriteState } : i
        )
      );
    } finally {
      setFavoriteLoading(null);
    }
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 bg-slate-800/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
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
          {localItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Nenhuma formatação ainda. Comece a formatar!</p>
              <Link href="/format">
                <Button variant="primary" className="text-sm">
                  Formatar Texto Agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {localItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all border border-slate-800 hover:border-slate-700 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <StyleBadge styleId={item.style_id} />
                      {item.is_favorite && (
                        <span className="text-yellow-400" title="Favorito">
                          <Star className="w-4 h-4 fill-yellow-400" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {item.output_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{getRelativeTime(item.created_at)}</span>
                      <span>•</span>
                      <span>{getCharacterChange(item.input_text, item.output_text)}</span>
                      {item.is_favorite && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">★ Salvo</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleView(item, e)}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCopy(item.output_text, e)}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copiar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleReformat(item, e)}
                        className="flex-1 sm:flex-none text-xs h-8"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Re-formatar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleFavorite(item, e)}
                        disabled={favoriteLoading === item.id}
                        className={`flex-1 sm:flex-none text-xs h-8 ${
                          item.is_favorite ? 'text-yellow-400 hover:text-yellow-300' : ''
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 mr-1.5 ${
                            favoriteLoading === item.id ? 'animate-pulse' : ''
                          } ${item.is_favorite ? 'fill-yellow-400' : ''}`}
                        />
                        {item.is_favorite ? 'Salvo' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {(totalCount && totalCount > 3) && (
                <Link href="/history">
                  <Button
                    variant="outline"
                    className="w-full mt-3 gap-2 text-sm"
                  >
                    Ver Todas no Histórico ({totalCount}) →
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-4xl">
            <DialogHeader onClose={() => setSelectedItem(null)}>
              <DialogTitle>Mensagem Formatada</DialogTitle>
              <div className="mt-2">
                <StyleBadge styleId={selectedItem.style_id} />
              </div>
            </DialogHeader>
            <DialogBody>
              <ScrollArea className="max-h-[60vh] space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Texto Original:</h4>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                    {selectedItem.input_text}
                  </div>
                </div>
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Texto Formatado:</h4>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                    {selectedItem.output_text}
                  </div>
                </div>
              </ScrollArea>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedItem.output_text)}
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
