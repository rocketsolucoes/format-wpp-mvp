import { supabase } from '../lib/supabase';

export interface UserFormattingProfile {
  style_level: 'flashy' | 'balanced' | 'clean';
  emoji_mode: 'smart' | 'keep_only' | 'off';
  layout_mode: 'preserve' | 'blocks';
  highlight_mode: 'essential_only' | 'important_words';
}

export interface FormatTextRequest {
  text: string;
  styleId?: string;
  // Novo sistema de formatação dinâmica
  intentMode?: 'general' | 'sales' | 'notice';
  userProfile?: UserFormattingProfile;
}

export interface FormatTextResponse {
  formatted_text: string;
  credits_remaining: number;
  tokens_used: number;
}

export class FormatterError extends Error {
  constructor(
    message: string,
    public code: 'AUTH_REQUIRED' | 'NO_CREDITS' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR',
    public status?: number
  ) {
    super(message);
    this.name = 'FormatterError';
  }
}

export async function formatText(
  text: string,
  styleId?: string,
  intentMode?: 'general' | 'sales' | 'notice',
  userProfile?: UserFormattingProfile
): Promise<FormatTextResponse> {
  if (text.length < 10) {
    throw new FormatterError(
      'O texto deve ter pelo menos 10 caracteres',
      'VALIDATION_ERROR',
      400
    );
  }

  if (text.length > 5000) {
    throw new FormatterError(
      'O texto deve ter menos de 5000 caracteres',
      'VALIDATION_ERROR',
      400
    );
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new FormatterError(
      'Você precisa estar logado para formatar texto',
      'AUTH_REQUIRED',
      401
    );
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = `${supabaseUrl}/functions/v1/format-text`;

  console.log('Formatting with styleId:', styleId);
  console.log('Formatting with intentMode:', intentMode);
  console.log('Formatting with userProfile:', userProfile);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        text,
        styleId,
        intentMode,
        userProfile
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Falha ao formatar texto';

      switch (response.status) {
        case 401:
          throw new FormatterError(
            'Falha na autenticação. Por favor, faça login novamente.',
            'AUTH_REQUIRED',
            401
          );
        case 403:
          throw new FormatterError(
            'Você não tem créditos restantes. Por favor, faça upgrade do seu plano.',
            'NO_CREDITS',
            403
          );
        case 400:
          throw new FormatterError(
            errorMessage,
            'VALIDATION_ERROR',
            400
          );
        case 500:
        default:
          throw new FormatterError(
            errorMessage,
            'SERVER_ERROR',
            response.status
          );
      }
    }

    const data: FormatTextResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof FormatterError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new FormatterError(
        'Erro de rede. Por favor, verifique sua conexão e tente novamente.',
        'NETWORK_ERROR'
      );
    }

    throw new FormatterError(
      'Ocorreu um erro inesperado. Por favor, tente novamente.',
      'SERVER_ERROR',
      500
    );
  }
}
