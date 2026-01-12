import React, { useState } from 'react';
import { ArrowLeft, Video, Phone, MoreVertical, Check } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';

interface WhatsAppPreviewProps {
  text: string;
  isLoading?: boolean;
}

export function WhatsAppPreview({ text, isLoading = false }: WhatsAppPreviewProps) {
  const [showFullText, setShowFullText] = useState(false);
  const MAX_PREVIEW_LENGTH = 500;

  const shouldTruncate = text.length > MAX_PREVIEW_LENGTH && !showFullText;
  const displayText = shouldTruncate ? text.slice(0, MAX_PREVIEW_LENGTH) + '...' : text;

  const renderFormattedText = (input: string) => {
    if (!input) return null;

    const lines = input.split('\n');
    const renderedLines = lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let keyCounter = 0;

      const formatPatterns = [
        {
          regex: /\*([^*\n]+)\*/g,
          render: (content: string, key: number) => (
            <strong key={key} className="font-bold">
              {content}
            </strong>
          ),
        },
        {
          regex: /_([^_\n]+)_/g,
          render: (content: string, key: number) => (
            <em key={key} className="italic">
              {content}
            </em>
          ),
        },
        {
          regex: /~([^~\n]+)~/g,
          render: (content: string, key: number) => (
            <s key={key} className="line-through opacity-75">
              {content}
            </s>
          ),
        },
        {
          regex: /```([^`\n]+)```/g,
          render: (content: string, key: number) => (
            <code
              key={key}
              className="bg-black/10 dark:bg-[#0c4a3d] px-1.5 py-0.5 rounded text-sm font-mono"
            >
              {content}
            </code>
          ),
        },
      ];

      const matches: Array<{
        index: number;
        length: number;
        element: React.ReactNode;
      }> = [];

      formatPatterns.forEach(({ regex, render }) => {
        const tempRegex = new RegExp(regex.source, regex.flags);
        let match;
        while ((match = tempRegex.exec(line)) !== null) {
          matches.push({
            index: match.index,
            length: match[0].length,
            element: render(match[1], keyCounter++),
          });
        }
      });

      matches.sort((a, b) => a.index - b.index);

      let lastIndex = 0;
      matches.forEach(({ index, length, element }) => {
        if (index > lastIndex) {
          parts.push(line.substring(lastIndex, index));
        }
        parts.push(element);
        lastIndex = index + length;
      });

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <React.Fragment key={lineIndex}>
          {parts.length > 0 ? parts : line}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });

    return renderedLines;
  };

  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <Card className="border-border bg-card overflow-hidden transition-colors duration-300">
      <CardContent className="p-3 sm:p-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div
            className="relative bg-slate-100 dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-[12px] border-slate-200 dark:border-slate-900"
            style={{ aspectRatio: '9/16' }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-200 dark:bg-slate-900 rounded-b-2xl z-10"></div>

            <div className="relative h-full flex flex-col bg-[#efeae2] dark:bg-[#0a1014] transition-colors duration-300">
              <div className="bg-[#075e54] dark:bg-[#202c33] px-3 py-2.5 pt-6 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-white flex-shrink-0" />
                  <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-500 flex items-center justify-center text-xs flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold truncate">
                      Pré-visualização
                    </div>
                    <div className="text-emerald-200 text-[10px]">online</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Video className="w-4 h-4 text-white" />
                  <Phone className="w-4 h-4 text-white" />
                  <MoreVertical className="w-4 h-4 text-white" />
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px] opacity-90 dark:opacity-100"
              >
                {isLoading ? (
                  <div className="flex justify-end">
                    <div className="bg-[#dcf8c6] dark:bg-[#005c4b] rounded-lg rounded-br-sm p-3 max-w-[80%] shadow-md">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                ) : text ? (
                  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative bg-[#dcf8c6] dark:bg-[#005c4b] rounded-lg rounded-br-sm p-3 max-w-[85%] shadow-md">
                      <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#dcf8c6] dark:border-t-[#005c4b] transform translate-x-[8px]"></div>

                      <div
                        className="text-slate-800 dark:text-white text-sm mb-1 break-words"
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          lineHeight: '1.4',
                        }}
                      >
                        {renderFormattedText(displayText)}
                      </div>

                      {shouldTruncate && (
                        <button
                          onClick={() => setShowFullText(true)}
                          className="text-emerald-700 dark:text-emerald-200 text-xs underline hover:text-emerald-800 dark:hover:text-emerald-100 transition-colors"
                        >
                          Ver Completo
                        </button>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-slate-500 dark:text-[#8bc1b3] text-[10px]">
                          {currentTime}
                        </span>
                        <div className="flex">
                          <Check className="w-3 h-3 text-[#53bdeb]" strokeWidth={3} />
                          <Check className="w-3 h-3 text-[#53bdeb] -ml-1.5" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-slate-500 dark:text-slate-400 text-[10px] text-center">
                      Sua mensagem formatada aparecerá aqui
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
