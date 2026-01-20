import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "Como funciona o plano gratuito?",
    answer: "Todos os novos usuários começam com 10 créditos de formatação gratuitos por mês. Você pode estilizar mensagens usando o estilo Casual. Para acessar o histórico, é necessário fazer upgrade para o plano Pro."
  },
  {
    question: "O que são os 'Estilos Pro'?",
    answer: "São modelos de IA otimizados para estilizar sua mensagem com objetivos específicos. O estilo 'Sales' aplica negritos e quebras de linha focadas em conversão, enquanto o 'Official' é ideal para comunicados sérios."
  },
  {
    question: "O sistema cria o texto para mim?",
    answer: "Não, o ZapStyle é focado em estilizar e formatar o texto que você já tem. Ele aplica as melhores práticas de formatação do WhatsApp (negrito, itálico, listas) para tornar sua mensagem existente mais profissional."
  },
  {
    question: "Posso cancelar minha assinatura Pro quando quiser?",
    answer: "Sim! Não há fidelidade. Você pode cancelar diretamente pelo painel de controle a qualquer momento e continuará com acesso Pro até o fim do período pago."
  },
  {
    question: "Meus dados e mensagens estão seguros?",
    answer: "Absolutamente. Usamos criptografia de ponta a ponta e não armazenamos suas mensagens para treinamento de IA de terceiros. Sua privacidade é nossa prioridade."
  }
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="bg-card border border-border rounded-xl overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left font-medium hover:bg-muted/50 transition-colors"
              >
                <span>{faq.question}</span>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {openIndex === i && (
                <div className="px-6 py-4 text-muted-foreground border-t border-border bg-muted/20">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
