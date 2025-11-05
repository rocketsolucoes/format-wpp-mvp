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

type BillingPeriod = 'monthly' | 'annual';

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { user } = useAuth();

  const proPrice = billingPeriod === 'monthly' ? 19.90 : 15.90;
  const proTotal = billingPeriod === 'monthly' ? proPrice : proPrice * 12;
  const savings = billingPeriod === 'annual' ? 48 : 0;

  const monthlyPriceId = 'price_1SPu4QRsqRrcMrSPgJwd8a2j';
  const annualPriceId = 'price_1SPu4jRsqRrcMrSP2M2b5POX';
  const currentPriceId = billingPeriod === 'monthly' ? monthlyPriceId : annualPriceId;

  const plans = [
    {
      name: 'Free',
      badge: { text: 'Free Forever', variant: 'success' as const },
      price: 0,
      period: 'month',
      description: 'Perfect for trying out the platform',
      features: [
        { text: '15 formatting per month', included: true },
        { text: 'Basic AI formatting', included: true },
        { text: '7-day history', included: true },
        { text: 'Community access', included: true },
        { text: 'Custom styles', included: false },
        { text: 'Priority support', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Get Started Free',
      ctaVariant: 'outline' as const,
      note: 'No credit card required',
      highlighted: false,
      icon: Sparkles,
    },
    {
      name: 'Pro',
      badge: { text: 'Most Popular', variant: 'default' as const },
      price: proPrice,
      period: billingPeriod === 'monthly' ? 'month' : 'month (billed annually)',
      description: 'Best for professionals and power users',
      features: [
        { text: 'Unlimited formatting', included: true },
        { text: 'Advanced AI formatting', included: true },
        { text: 'Complete history', included: true },
        { text: 'Custom style library', included: true },
        { text: 'Ready-made templates', included: true },
        { text: 'Priority support', included: true },
        { text: 'No ads', included: true },
        { text: 'Export to PDF', included: true },
      ],
      cta: 'Subscribe to Pro',
      ctaVariant: 'default' as const,
      note: '7-day money-back guarantee',
      highlighted: true,
      icon: Zap,
      savings: savings > 0 ? `Save $${savings}` : undefined,
    },
    {
      name: 'Enterprise',
      badge: { text: 'For Teams', variant: 'info' as const },
      price: null,
      period: 'Custom',
      description: 'Advanced features for organizations',
      features: [
        { text: 'Everything in Pro +', included: true },
        { text: 'Dedicated API', included: true },
        { text: 'White-label option', included: true },
        { text: 'Guaranteed SLA', included: true },
        { text: 'Account manager', included: true },
        { text: 'Custom onboarding', included: true },
        { text: 'Custom billing', included: true },
        { text: 'SSO integration', included: true },
      ],
      cta: 'Talk to Sales',
      ctaVariant: 'outline' as const,
      note: 'Custom pricing for teams',
      highlighted: false,
      icon: Building,
    },
  ];

  const comparisonFeatures = [
    { name: 'Formatting per month', free: '15', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'History retention', free: '7 days', pro: 'Forever', enterprise: 'Forever' },
    { name: 'Custom styles', free: false, pro: true, enterprise: true },
    { name: 'Templates', free: false, pro: true, enterprise: true },
    { name: 'Support response time', free: '48h', pro: '4h', enterprise: '1h' },
    { name: 'API access', free: false, pro: false, enterprise: true },
    { name: 'White-label', free: false, pro: false, enterprise: true },
    { name: 'SLA guarantee', free: false, pro: false, enterprise: true },
    { name: 'Team collaboration', free: false, pro: false, enterprise: true },
    { name: 'SSO', free: false, pro: false, enterprise: true },
  ];

  const faqs = [
    {
      question: 'How does the trial period work?',
      answer: 'All new users start with a free account that includes 15 formatting operations per month. You can upgrade to Pro anytime to unlock unlimited access. Pro subscriptions come with a 7-day money-back guarantee, so you can try it risk-free.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, absolutely! You can cancel your subscription at any time from your account settings. If you cancel, you will retain access to Pro features until the end of your billing period. No questions asked, no cancellation fees.',
    },
    {
      question: 'Do credits expire?',
      answer: 'Free plan credits reset monthly and do not roll over. Pro users have unlimited formatting operations, so there are no credits to worry about. Your usage history is always preserved regardless of your plan.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. All payments are processed securely through Stripe, and we never store your payment information on our servers.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes! We offer a 7-day money-back guarantee on all Pro subscriptions. If you are not satisfied with your purchase for any reason, contact us within 7 days of your purchase for a full refund. No questions asked.',
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings. When upgrading, you will get immediate access to new features. When downgrading, changes take effect at the end of your current billing period.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption for all data transmission and storage. Your formatting history is encrypted at rest, and we never share your data with third parties. We are compliant with GDPR and other data protection regulations.',
    },
    {
      question: 'Do you offer discounts for nonprofits?',
      answer: 'Yes! We offer a 30% discount on Pro plans for registered nonprofit organizations and educational institutions. Contact our sales team with proof of your nonprofit status to get started with the discounted pricing.',
    },
  ];

  const testimonials = [
    {
      quote: "This tool has completely transformed how I format messages for my clients. The AI suggestions are spot-on and save me hours every week.",
      name: "Sarah Chen",
      role: "Content Manager",
      company: "TechCorp",
      initial: "S",
    },
    {
      quote: "We upgraded to Pro after the first week. The custom styles and templates make our team's communication consistent and professional.",
      name: "Michael Rodriguez",
      role: "Marketing Director",
      company: "Growth Labs",
      initial: "M",
    },
    {
      quote: "The Enterprise plan has been perfect for our organization. The dedicated API and white-label options integrate seamlessly with our workflow.",
      name: "Emily Taylor",
      role: "VP of Operations",
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Choose the Perfect Plan for You
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Start free and upgrade when you need
          </p>

          <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as BillingPeriod)} className="inline-flex">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual
                {billingPeriod === 'annual' && (
                  <Badge variant="success" className="ml-2">Save 20%</Badge>
                )}
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
                          ${plan.price}
                          <span className="text-xl text-slate-400 font-normal">/{plan.period.split(' ')[0]}</span>
                        </div>
                        {billingPeriod === 'annual' && plan.savings && (
                          <Badge variant="success" className="mt-2">{plan.savings}</Badge>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold">Contact Sales</div>
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
          <h2 className="text-4xl font-bold text-center mb-12">Compare Plans</h2>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-semibold">Feature</th>
                  <th className="text-center p-4 text-slate-400 font-semibold">Free</th>
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
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
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
          <h2 className="text-4xl font-bold text-center mb-12">What Our Users Say</h2>
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
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users formatting messages professionally
          </p>
          <Button
            onClick={() => setLocation('/auth')}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-lg px-8 py-6"
          >
            Create Free Account
          </Button>
          <p className="text-sm text-slate-400 mt-4">No credit card required</p>
        </div>
      </div>

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Fill out the form below and our team will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setContactModalOpen(false); }}>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="john@company.com" required />
            </div>
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="Acme Corp" required />
            </div>
            <div>
              <Label htmlFor="team-size">Team Size</Label>
              <Input id="team-size" placeholder="e.g., 10-50" required />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500">
              Send Message
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
