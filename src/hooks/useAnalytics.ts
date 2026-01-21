import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Declaração de tipo para gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * useAnalytics Hook
 *
 * Hook customizado para integração com Google Analytics 4.
 * Rastreia automaticamente mudanças de página (page views) usando o Wouter router.
 *
 * Configurações aplicadas:
 * - Rastreamento automático de page_view em mudanças de rota
 * - Envio de página atual (page_path e page_title)
 * - Suporte a eventos customizados através de trackEvent()
 *
 * @example
 * // No componente App ou layout principal
 * useAnalytics();
 *
 * // Para rastrear eventos customizados
 * import { trackEvent } from '@/hooks/useAnalytics';
 * trackEvent('button_click', { button_name: 'subscribe' });
 */
export const useAnalytics = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Verifica se gtag está disponível
    if (typeof window.gtag === 'function') {
      // Envia page_view com informações da página
      window.gtag('event', 'page_view', {
        page_path: location,
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [location]);
};

/**
 * Função auxiliar para rastrear eventos customizados no Google Analytics
 *
 * @param eventName - Nome do evento a ser rastreado
 * @param eventParams - Parâmetros adicionais do evento
 *
 * @example
 * trackEvent('purchase', { value: 99.90, currency: 'BRL' });
 * trackEvent('sign_up', { method: 'google' });
 * trackEvent('form_submit', { form_name: 'contact' });
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Função auxiliar para definir propriedades de usuário no Google Analytics
 *
 * @param userId - ID do usuário (opcional)
 * @param userProperties - Propriedades customizadas do usuário
 *
 * @example
 * setUserProperties('user_123', { plan: 'premium', signup_date: '2024-01-01' });
 */
export const setUserProperties = (
  userId?: string,
  userProperties?: Record<string, any>
) => {
  if (typeof window.gtag === 'function') {
    if (userId) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...userProperties,
      });
    } else if (userProperties) {
      window.gtag('set', 'user_properties', userProperties);
    }
  }
};
