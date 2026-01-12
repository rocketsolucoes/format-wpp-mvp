import React from 'react';
import { Shield, Lock, CheckCircle, Zap } from 'lucide-react';

interface Badge {
  icon: React.ReactNode;
  text: string;
}

const TrustBadges: React.FC = () => {
  const badges: Badge[] = [
    {
      icon: <Shield className="w-5 h-5" />,
      text: 'Pagamento Seguro'
    },
    {
      icon: <Lock className="w-5 h-5" />,
      text: 'Dados Criptografados'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: 'LGPD Compliant'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      text: 'Suporte Rápido'
    }
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-6 py-8 border-t border-border/50">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="text-primary">
            {badge.icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
