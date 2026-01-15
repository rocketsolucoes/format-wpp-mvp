import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

/**
 * ThankYou Page
 * 
 * Página exibida após conclusão de compra na Hotmart.
 * Verifica o status da assinatura e redireciona para o dashboard.
 */
export default function ThankYou() {
  const [, setLocation] = useLocation();
  const { user, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    // Verificar status da assinatura
    const checkSubscription = async () => {
      if (!user) {
        setLocation('/auth');
        return;
      }

      try {
        // Aguardar alguns segundos para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Buscar profile atualizado
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', user.id)
          .single();

        if (profile?.plan === 'pro' && profile?.subscription_status === 'active') {
          setSubscriptionActive(true);
          // Atualizar contexto de autenticação
          await refreshProfile?.();
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
  }, [user, setLocation, refreshProfile]);

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Processando seu pagamento...
          </h2>
          <p className="text-slate-400">
            Aguarde enquanto confirmamos sua assinatura
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-center border border-slate-700">
        {/* Ícone de sucesso */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🎉 Parabéns!
        </h1>

        {/* Mensagem */}
        {subscriptionActive ? (
          <>
            <p className="text-xl text-slate-300 mb-2">
              Sua assinatura Pro foi ativada com sucesso!
            </p>
            <p className="text-slate-400 mb-8">
              Agora você tem acesso ilimitado a todas as funcionalidades premium.
            </p>
          </>
        ) : (
          <>
            <p className="text-xl text-slate-300 mb-2">
              Seu pagamento foi processado!
            </p>
            <p className="text-slate-400 mb-8">
              Sua assinatura será ativada em alguns minutos. Você receberá um email de confirmação.
            </p>
          </>
        )}

        {/* Benefícios */}
        <div className="bg-slate-700/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">
            ✨ O que você ganhou:
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Créditos ilimitados para formatação de mensagens</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Histórico completo de todas as suas formatações</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Estilos favoritos salvos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Suporte prioritário</span>
            </li>
          </ul>
        </div>

        {/* Botão de ação */}
        <Button
          onClick={handleGoToDashboard}
          size="lg"
          className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8"
        >
          Ir para o Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Informação adicional */}
        <p className="text-sm text-slate-500 mt-6">
          Dúvidas? Entre em contato com nosso suporte pelo WhatsApp
        </p>
      </div>
    </div>
  );
}
