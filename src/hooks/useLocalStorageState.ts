import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Hook customizado que sincroniza um estado com o localStorage
 * @param key - Chave do localStorage
 * @param defaultValue - Valor padrão inicial
 * @returns [state, setState] - Estado e função para atualizar
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Inicializa o estado com o valor do localStorage ou o valor padrão
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Atualiza o localStorage quando o estado mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}
