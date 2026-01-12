import React, { useState } from 'react';
import { Check, Sparkles, Zap, Building, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { PRICING, formatBRL as formatCurrency } from '../constants/pricing';
import { useAuth } from '../hooks/useAuth';

type BillingPeriod = 'monthly' | 'annual';

const PricingSection: React.FC = () => {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { user } = useAuth();

  const proPrice = billingPeriod === 'monthly' ? PRICING.PRO_MONTHLY_PRICE : PRICING.PRO_ANNUAL_MONTHLY_PRICE;
  const formatBRL = formatCurrency;

  const plans = [
    {
      name: 'Gratuito',
      badge: { text: 'Grátis Para Sempre', variant: 'success' as const },
      price: 0,
      period: 'mês',
      description: 'Perfeito para experimentar a plataforma',
      features: [
        { text: '30 formatações por mês', included: true },
        { text: 'Estilo Casual', included: true },
        { text: 'Estilização básica por IA', included: true },
        { text: 'Histórico completo', included: true },
        { text: 'Estilos Pro (Sales e Official)', included: false },
      ],
      cta: 'Começar Grátis',
      ctaVariant: 'outline' as const,
      highlighted: false,
      icon: Sparkles,
    },
    {
      name: 'Pro',
      badge: { text: 'Mais Popular', variant: 'default' as const },
      price: proPrice,
      period: billingPeriod === 'monthly' ? 'mês' : 'mês (anual)',
      description: 'Melhor para profissionais e vendedores',
      features: [
        { text: 'Formatação ilimitada', included: true },
        { text: 'Todos os 3 estilos (Casual, Sales, Official)', included: true },
        { text: 'Histórico completo', included: true },
        { text: 'Análises avançadas com gráficos', included: true },
        { text: 'Salvar favoritos ilimitados', included: true },
      ],
      cta: 'Assinar o Pro',
      ctaVariant: 'primary' as const,
      highlighted: true,
      icon: Zap,
    },
    {
      name: 'Enterprise',
      badge: { text: 'Para Equipes', variant: 'info' as const },
      price: null,
      period: 'Personalizado',
      description: 'Recursos avançados para organizações',
      features: [
        { text: 'Tudo do Pro +', included: true },
        { text: 'API dedicada', included: true },
        { text: 'Opção white-label', included: true },
        { text: 'SLA garantido', included: true },
        { text: 'Gerente de conta', included: true },
      ],
      cta: 'Falar com Vendas',
      ctaVariant: 'outline' as const,
      highlighted: false,
      icon: Building,
    },
  ];

  return (
    <section id="pricing" className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Planos Simples e Transparentes</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Escolha o plano ideal para o seu momento. Deixe a IA cuidar da estilização das suas mensagens enquanto você foca no que importa.
        </p>
        
        <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as BillingPeriod)} className="inline-flex">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="annual" className="gap-2">
              Anual
              <Badge variant="success" className="ml-1 text-[10px]">Economize 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Garantia destacada */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>
            <strong className="text-foreground">Cancele quando quiser.</strong> Sem fidelidade, sem letras miúdas.
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.name}
              className={`relative transition-all duration-300 hover:scale-105 flex flex-col ${
                plan.highlighted
                  ? 'border-primary shadow-2xl shadow-primary/10'
                  : 'bg-card/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground border-none px-3 py-1">
                    RECOMENDADO
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${plan.highlighted ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <Badge variant={plan.badge.variant}>{plan.badge.text}</Badge>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{formatBRL(plan.price)}</span>
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">Sob Consulta</span>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border border-border rounded-full mt-0.5 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.ctaVariant}
                  className="w-full h-12 font-bold"
                  onClick={() => setLocation('/auth')}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default PricingSection;
