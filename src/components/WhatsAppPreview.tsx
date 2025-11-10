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
      let currentText = line;
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
              className="bg-[#0c4a3d] px-1.5 py-0.5 rounded text-sm font-mono"
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
    <Card className="border-slate-700 overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div
            className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
            style={{ aspectRatio: '9/16' }}
          >
            <div className="absolute inset-0 border-[12px] border-slate-900 rounded-[2.5rem] pointer-events-none"></div>

            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-2xl z-10"></div>

            <div className="relative h-full flex flex-col bg-[#0a1014]">
              <div className="bg-[#075e54] px-3 py-2.5 pt-6 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-white flex-shrink-0" />
                  <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center text-xs flex-shrink-0">
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
                className="flex-1 overflow-y-auto p-4"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #0d1418 0px, #0d1418 10px, #0a1014 10px, #0a1014 20px)',
                }}
              >
                {isLoading ? (
                  <div className="flex justify-end">
                    <div className="bg-[#005c4b] rounded-lg rounded-br-sm p-3 max-w-[80%] shadow-md">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                ) : text ? (
                  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative bg-[#005c4b] rounded-lg rounded-br-sm p-3 max-w-[85%] shadow-md">
                      <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#005c4b] transform translate-x-[8px]"></div>

                      <div
                        className="text-white text-sm mb-1 break-words"
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
                          className="text-emerald-200 text-xs underline hover:text-emerald-100 transition-colors"
                        >
                          Ver Completo
                        </button>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[#8bc1b3] text-xs">
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
                    <div className="text-slate-500 text-xs text-center px-8">
                      Sua mensagem formatada aparecerá aqui
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
