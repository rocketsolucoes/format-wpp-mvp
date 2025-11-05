import { supabase } from '../lib/supabase';

export interface FormatTextRequest {
  text: string;
  styleId?: string;
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
  styleId?: string
): Promise<FormatTextResponse> {
  if (text.length < 10) {
    throw new FormatterError(
      'Text must be at least 10 characters long',
      'VALIDATION_ERROR',
      400
    );
  }

  if (text.length > 5000) {
    throw new FormatterError(
      'Text must be less than 5000 characters',
      'VALIDATION_ERROR',
      400
    );
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new FormatterError(
      'You must be logged in to format text',
      'AUTH_REQUIRED',
      401
    );
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = `${supabaseUrl}/functions/v1/format-text`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text, styleId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to format text';

      switch (response.status) {
        case 401:
          throw new FormatterError(
            'Authentication failed. Please sign in again.',
            'AUTH_REQUIRED',
            401
          );
        case 403:
          throw new FormatterError(
            'You have no credits remaining. Please upgrade your plan.',
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
        'Network error. Please check your connection and try again.',
        'NETWORK_ERROR'
      );
    }

    throw new FormatterError(
      'An unexpected error occurred. Please try again.',
      'SERVER_ERROR',
      500
    );
  }
}
