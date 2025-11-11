import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Shield, Users, Building, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import CheckoutButton from '../components/CheckoutButton';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PRICING, formatBRL as formatCurrency, calculateAnnualSavings } from '../constants/pricing';

type BillingPeriod = 'monthly' | 'annual';

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { user } = useAuth();

  const proPrice = billingPeriod === 'monthly' ? PRICING.PRO_MONTHLY_PRICE : PRICING.PRO_ANNUAL_MONTHLY_PRICE;
  const proTotal = billingPeriod === 'monthly' ? PRICING.PRO_MONTHLY_PRICE : PRICING.PRO_ANNUAL_TOTAL_PRICE;
  const savings = billingPeriod === 'annual' ? calculateAnnualSavings() : 0;

  const formatBRL = formatCurrency;
  const currentPriceId = billingPeriod === 'monthly' ? PRICING.STRIPE_PRICE_ID_MONTHLY : PRICING.STRIPE_PRICE_ID_ANNUAL;

  const plans = [
    {
      name: 'Gratuito',
      badge: { text: 'Grátis Para Sempre', variant: 'success' as const },
      price: 0,
      period: 'month',
      description: 'Perfeito para experimentar a plataforma',
      features: [
        { text: '30 créditos por mês', included: true },
        { text: 'Estilo Casual', included: true },
        { text: 'Formatação básica por IA', included: true },
        { text: 'Histórico completo', included: true },
        { text: 'Estilos Pro (Sales e Official)', included: false },
        { text: 'Análises avançadas', included: false },
        { text: 'Salvar favoritos', included: false },
        { text: 'Suporte prioritário', included: false },
      ],
      cta: 'Começar Grátis',
      ctaVariant: 'outline' as const,
      note: 'Sem cartão de crédito necessário',
      highlighted: false,
      icon: Sparkles,
    },
    {
      name: 'Pro',
      badge: { text: 'Mais Popular', variant: 'default' as const },
      price: proPrice,
      period: billingPeriod === 'monthly' ? 'mês' : 'mês (cobrado anualmente)',
      description: 'Melhor para profissionais e usuários avançados',
      features: [
        { text: 'Formatação ilimitada', included: true },
        { text: 'Todos os 3 estilos (Casual, Sales, Official)', included: true },
        { text: 'Histórico completo', included: true },
        { text: 'Análises avançadas com gráficos', included: true },
        { text: 'Mapa de atividade (4 semanas)', included: true },
        { text: 'Distribuição por estilo', included: true },
        { text: 'Insights e recomendações', included: true },
        { text: 'Salvar favoritos ilimitados', included: true },
        { text: 'Suporte prioritário', included: true },
      ],
      cta: 'Assinar o Pro',
      ctaVariant: 'default' as const,
      note: 'Garantia de reembolso de 7 dias',
      highlighted: true,
      icon: Zap,
      savings: savings > 0 ? `Economize ${formatBRL(savings)}` : undefined,
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
        { text: 'Integração personalizada', included: true },
        { text: 'Cobrança personalizada', included: true },
        { text: 'Integração SSO', included: true },
      ],
      cta: 'Falar com Vendas',
      ctaVariant: 'outline' as const,
      note: 'Preços personalizados para equipes',
      highlighted: false,
      icon: Building,
    },
  ];

  const comparisonFeatures = [
    { name: 'Formatações por mês', free: '30 créditos', pro: 'Ilimitado', enterprise: 'Ilimitado' },
    { name: 'Retenção de histórico', free: 'Para sempre', pro: 'Para sempre', enterprise: 'Para sempre' },
    { name: 'Estilos de formatação', free: '1 (Casual)', pro: '3 (Todos)', enterprise: '3 (Todos)' },
    { name: 'Estilos Pro (Sales, Official)', free: false, pro: true, enterprise: true },
    { name: 'Análises avançadas', free: false, pro: true, enterprise: true },
    { name: 'Mapa de atividade (4 semanas)', free: false, pro: true, enterprise: true },
    { name: 'Distribuição por estilo', free: false, pro: true, enterprise: true },
    { name: 'Salvar favoritos', free: false, pro: true, enterprise: true },
    { name: 'Tempo de resposta do suporte', free: '48h', pro: '4h', enterprise: '1h' },
    { name: 'Acesso à API', free: false, pro: false, enterprise: true },
    { name: 'White-label', free: false, pro: false, enterprise: true },
    { name: 'Garantia de SLA', free: false, pro: false, enterprise: true },
    { name: 'Colaboração em equipe', free: false, pro: false, enterprise: true },
    { name: 'SSO', free: false, pro: false, enterprise: true },
  ];

  const faqs = [
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'Todos os novos usuários começam com uma conta gratuita que inclui 30 créditos por mês (renovados automaticamente todo mês). Você tem acesso ao estilo Casual e seu histórico completo é preservado. Pode fazer upgrade para o Pro a qualquer momento para desbloquear formatação ilimitada, todos os 3 estilos e análises avançadas. As assinaturas Pro vêm com garantia de reembolso de 7 dias.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim, absolutamente! Você pode cancelar sua assinatura a qualquer momento nas configurações da sua conta. Se cancelar, você manterá o acesso aos recursos Pro até o final do período de cobrança. Sem perguntas, sem taxas de cancelamento.',
    },
    {
      question: 'Os créditos expiram?',
      answer: 'Os créditos do plano gratuito são renovados mensalmente (30 créditos a cada mês) e não acumulam. Se você não usar todos os seus créditos em um mês, eles não são transferidos para o próximo. Usuários Pro têm formatação ilimitada, então não há créditos para se preocupar. Seu histórico completo é sempre preservado independentemente do seu plano.',
    },
    {
      question: 'Quais métodos de pagamento vocês aceitam?',
      answer: 'Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express, Discover) e cartões de débito. Todos os pagamentos são processados de forma segura através do Stripe, e nunca armazenamos suas informações de pagamento em nossos servidores.',
    },
    {
      question: 'Vocês oferecem reembolso?',
      answer: 'Sim! Oferecemos garantia de reembolso de 7 dias em todas as assinaturas Pro. Se você não estiver satisfeito com sua compra por qualquer motivo, entre em contato conosco dentro de 7 dias da compra para um reembolso total. Sem perguntas.',
    },
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento nas configurações da sua conta. Ao fazer upgrade, você terá acesso imediato aos novos recursos. Ao fazer downgrade, as mudanças entram em vigor no final do período de cobrança atual.',
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente. Usamos criptografia padrão da indústria para toda transmissão e armazenamento de dados. Seu histórico de formatação é criptografado em repouso, e nunca compartilhamos seus dados com terceiros. Estamos em conformidade com a LGPD, GDPR e outros regulamentos de proteção de dados.',
    },
    {
      question: 'Vocês oferecem descontos para organizações sem fins lucrativos?',
      answer: 'Sim! Oferecemos 30% de desconto em planos Pro para organizações sem fins lucrativos registradas e instituições educacionais. Entre em contato com nossa equipe de vendas com comprovante de seu status de organização sem fins lucrativos para começar com o preço com desconto.',
    },
  ];

  const testimonials = [
    {
      quote: "Esta ferramenta transformou completamente como formato mensagens para meus clientes. As sugestões da IA são precisas e me economizam horas toda semana.",
      name: "Sarah Chen",
      role: "Gerente de Conteúdo",
      company: "TechCorp",
      initial: "S",
    },
    {
      quote: "Fizemos upgrade para o Pro após a primeira semana. Os estilos e modelos personalizados tornam a comunicação da nossa equipe consistente e profissional.",
      name: "Michael Rodriguez",
      role: "Diretor de Marketing",
      company: "Growth Labs",
      initial: "M",
    },
    {
      quote: "O plano Enterprise tem sido perfeito para nossa organização. A API dedicada e as opções white-label se integram perfeitamente ao nosso fluxo de trabalho.",
      name: "Emily Taylor",
      role: "VP de Operações",
      company: "Enterprise Co",
      initial: "E",
    },
  ];

  const handlePlanClick = (planName: string) => {
    if (planName === 'Enterprise') {
      setContactModalOpen(true);
    } else {
      setLocation('/auth');
    }
  };

  const pricingContent = (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as BillingPeriod)} className="inline-flex">
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="annual" className="gap-2">
                Anual
                <Badge variant="success" className="ml-1 text-xs">Economize 20%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative transition-all duration-300 hover:scale-105 ${
                  plan.highlighted
                    ? 'border-2 border-transparent bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 scale-105 shadow-2xl shadow-emerald-500/20'
                    : 'border-slate-800 hover:shadow-xl'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse">
                      {plan.badge.text}
                    </Badge>
                  </div>
                )}
                {!plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant={plan.badge.variant}>{plan.badge.text}</Badge>
                  </div>
                )}

                <CardHeader className="text-center pt-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    {plan.price !== null ? (
                      <>
                        <div className="text-5xl font-bold">
                          {formatBRL(plan.price)}
                          <span className="text-xl text-slate-400 font-normal">/{plan.period.split(' ')[0]}</span>
                        </div>
                        {billingPeriod === 'annual' && plan.name === 'Pro' && (
                          <p className="text-sm text-slate-400 mt-2">
                            {formatBRL(proTotal)} cobrado anualmente
                          </p>
                        )}
                        {billingPeriod === 'annual' && plan.savings && (
                          <Badge variant="success" className="mt-2">{plan.savings}</Badge>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold">Falar com Vendas</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-slate-200' : 'text-slate-600'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.name === 'Pro' ? (
                    <CheckoutButton
                      priceId={currentPriceId}
                      planName={plan.name}
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600' : ''}`}
                    >
                      {plan.cta}
                    </CheckoutButton>
                  ) : (
                    <Button
                      onClick={() => handlePlanClick(plan.name)}
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600' : ''}`}
                    >
                      {plan.cta}
                    </Button>
                  )}
                  <p className="text-xs text-slate-500 text-center mt-3">{plan.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-24 max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Comparar Planos</h2>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-semibold">Recurso</th>
                  <th className="text-center p-4 text-slate-400 font-semibold">Gratuito</th>
                  <th className="text-center p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 font-semibold text-emerald-400">
                    Pro
                  </th>
                  <th className="text-center p-4 text-slate-400 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-slate-800/50">
                    <td className="p-4 text-slate-200">{feature.name}</td>
                    <td className="p-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-400">{feature.free}</span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-emerald-400 font-semibold">{feature.pro}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-400">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {comparisonFeatures.map((feature, index) => (
              <Card key={index} className="border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Free</p>
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-slate-400 text-sm">{feature.free}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 mb-2">Pro</p>
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-emerald-400 text-sm font-semibold">{feature.pro}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Enterprise</p>
                    {typeof feature.enterprise === 'boolean' ? (
                      feature.enterprise ? (
                        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-slate-400 text-sm">{feature.enterprise}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-24 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-slate-800 cursor-pointer hover:border-emerald-700/50 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {faq.question}
                    <span className="text-slate-500">{expandedFaq === index ? '−' : '+'}</span>
                  </CardTitle>
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent>
                    <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-24 max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">O Que Nossos Usuários Dizem</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-400">{testimonial.role}</p>
                      <p className="text-sm text-slate-500">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl p-12 text-center border border-emerald-500/20">
          <h2 className="text-4xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Junte-se a milhares de usuários formatando mensagens profissionalmente
          </p>
          <Button
            onClick={() => setLocation('/auth')}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-lg px-8 py-6"
          >
            Criar Conta Gratuita
          </Button>
          <p className="text-sm text-slate-400 mt-4">Sem cartão de crédito necessário</p>
        </div>
    </div>
  );

  const contactModal = (
    <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Falar com Vendas</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo e nossa equipe entrará em contato em até 24 horas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setContactModalOpen(false); }}>
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" placeholder="João Silva" required />
          </div>
          <div>
            <Label htmlFor="email">E-mail Corporativo</Label>
            <Input id="email" type="email" placeholder="joao@empresa.com" required />
          </div>
          <div>
            <Label htmlFor="company">Nome da Empresa</Label>
            <Input id="company" placeholder="Empresa LTDA" required />
          </div>
          <div>
            <Label htmlFor="team-size">Tamanho da Equipe</Label>
            <Input id="team-size" placeholder="ex: 10-50" required />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500">
            Enviar Mensagem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (user) {
    return (
      <DashboardLayout>
        <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Preços</h1>
          <p className="text-sm text-slate-400">Escolha o plano perfeito para você</p>
        </div>
        {pricingContent}
        {contactModal}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Escolha o Plano Perfeito para Você
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Comece grátis e faça upgrade quando precisar
          </p>
        </div>
        {pricingContent}
        {contactModal}
      </div>
    </div>
  );
}
