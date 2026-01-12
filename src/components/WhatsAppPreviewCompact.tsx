import React from 'react';
import { Check } from 'lucide-react';

interface WhatsAppPreviewCompactProps {
  text: string;
}

export function WhatsAppPreviewCompact({ text }: WhatsAppPreviewCompactProps) {
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
              className="bg-[#0c4a3d] px-1 py-0.5 rounded text-xs font-mono"
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
    <div className="bg-[#0a1014] p-3 rounded-lg border border-border">
      <div className="flex justify-end">
        <div className="relative bg-[#005c4b] rounded-lg rounded-br-sm p-2.5 min-w-[240px] max-w-full shadow-md">
          <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-[#005c4b] transform translate-x-[6px]"></div>

          <div
            className="text-white text-xs mb-1 break-words"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.4',
            }}
          >
            {renderFormattedText(text)}
          </div>

          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[#8bc1b3] text-[10px]">
              {currentTime}
            </span>
            <div className="flex">
              <Check className="w-2.5 h-2.5 text-[#53bdeb]" strokeWidth={3} />
              <Check className="w-2.5 h-2.5 text-[#53bdeb] -ml-1" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
