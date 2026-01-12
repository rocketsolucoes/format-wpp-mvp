import React from 'react';
import { Sparkles, Mail, FileText, Shield, HelpCircle } from 'lucide-react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Funcionalidades', href: '/#features' },
      { label: 'Preços', href: '/pricing' },
      { label: 'Como Funciona', href: '/#how-it-works' },
      { label: 'Exemplos', href: '/#examples' }
    ],
    legal: [
      { label: 'Termos de Uso', href: '/terms' },
      { label: 'Política de Privacidade', href: '/privacy' },
      { label: 'LGPD', href: '/lgpd' },
      { label: 'Cookies', href: '/cookies' }
    ],
    support: [
      { label: 'Central de Ajuda', href: '/help' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contato', href: '/contact' },
      { label: 'Status', href: '/status' }
    ]
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Coluna 1: Logo e Descrição */}
          <div className="md:col-span-1">
            <Link href="/">
              <a className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <div className="p-2 bg-primary rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Magic Formatter
                </span>
              </a>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Transforme suas mensagens do WhatsApp com IA. Formatação profissional em segundos.
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href="mailto:contato@formatapp.com" className="text-sm hover:text-primary transition-colors">
                contato@formatapp.com
              </a>
            </div>
          </div>

          {/* Coluna 2: Produto */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Produto
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Suporte */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Suporte
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} Format App. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                🇧🇷 Português
              </a>
              <div className="flex gap-4">
                {/* Redes sociais podem ser adicionadas aqui */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
