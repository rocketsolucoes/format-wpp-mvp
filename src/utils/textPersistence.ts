/**
 * Text Persistence Utility
 *
 * Manages temporary text storage for unauthenticated users
 * to preserve their work when redirecting to login.
 */

const PENDING_TEXT_KEY = 'pendingText';
const PENDING_TEXT_TIME_KEY = 'pendingTextTime';
const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Save text to localStorage before redirecting to login
 */
export const savePendingText = (text: string): boolean => {
  try {
    if (!text || text.trim().length === 0) {
      return false;
    }

    localStorage.setItem(PENDING_TEXT_KEY, text.trim());
    localStorage.setItem(PENDING_TEXT_TIME_KEY, Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to save pending text to localStorage:', error);
    return false;
  }
};

/**
 * Get pending text if it exists and hasn't expired
 */
export const getPendingText = (): string | null => {
  try {
    const text = localStorage.getItem(PENDING_TEXT_KEY);
    const timeStr = localStorage.getItem(PENDING_TEXT_TIME_KEY);

    if (!text || !timeStr) {
      return null;
    }

    const elapsed = Date.now() - parseInt(timeStr, 10);

    if (elapsed >= EXPIRATION_TIME) {
      clearPendingText();
      return null;
    }

    return text;
  } catch (error) {
    console.error('Failed to get pending text from localStorage:', error);
    return null;
  }
};

/**
 * Check if pending text exists and is valid
 */
export const hasPendingText = (): boolean => {
  return getPendingText() !== null;
};

/**
 * Clear pending text from localStorage
 */
export const clearPendingText = (): void => {
  try {
    localStorage.removeItem(PENDING_TEXT_KEY);
    localStorage.removeItem(PENDING_TEXT_TIME_KEY);
  } catch (error) {
    console.error('Failed to clear pending text from localStorage:', error);
  }
};

/**
 * Get time remaining before text expires (in milliseconds)
 */
export const getPendingTextTimeRemaining = (): number => {
  try {
    const timeStr = localStorage.getItem(PENDING_TEXT_TIME_KEY);

    if (!timeStr) {
      return 0;
    }

    const elapsed = Date.now() - parseInt(timeStr, 10);
    const remaining = EXPIRATION_TIME - elapsed;

    return Math.max(0, remaining);
  } catch (error) {
    console.error('Failed to get pending text time remaining:', error);
    return 0;
  }
};

/**
 * Save formatted text and input text for preview flow
 */
export const saveFormattedPreview = (inputText: string, formattedText: string): boolean => {
  try {
    if (!inputText || !formattedText) {
      return false;
    }

    localStorage.setItem('pendingInputText', inputText.trim());
    localStorage.setItem('pendingFormattedText', formattedText.trim());
    localStorage.setItem('pendingFormattedTime', Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to save formatted preview to localStorage:', error);
    return false;
  }
};

/**
 * Get formatted preview if it exists and hasn't expired
 */
export const getFormattedPreview = (): { inputText: string; formattedText: string } | null => {
  try {
    const inputText = localStorage.getItem('pendingInputText');
    const formattedText = localStorage.getItem('pendingFormattedText');
    const timeStr = localStorage.getItem('pendingFormattedTime');

    if (!inputText || !formattedText || !timeStr) {
      return null;
    }

    const elapsed = Date.now() - parseInt(timeStr, 10);

    if (elapsed >= EXPIRATION_TIME) {
      clearFormattedPreview();
      return null;
    }

    return { inputText, formattedText };
  } catch (error) {
    console.error('Failed to get formatted preview from localStorage:', error);
    return null;
  }
};

/**
 * Clear formatted preview from localStorage
 */
export const clearFormattedPreview = (): void => {
  try {
    localStorage.removeItem('pendingInputText');
    localStorage.removeItem('pendingFormattedText');
    localStorage.removeItem('pendingFormattedTime');
  } catch (error) {
    console.error('Failed to clear formatted preview from localStorage:', error);
  }
};

/**
 * Check if formatted preview exists and is valid
 */
export const hasFormattedPreview = (): boolean => {
  return getFormattedPreview() !== null;
};
