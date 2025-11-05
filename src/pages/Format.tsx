import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import InputTextarea from '../components/InputTextarea';
import OutputTextarea from '../components/OutputTextarea';
import { toast } from '../components/ui/Toaster';
import { Progress } from '../components/ui/Progress';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { formatText, FormatterError } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Format() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setValidationError(null);
    } else if (inputText.trim().length < 10) {
      setValidationError('Text must be at least 10 characters');
    } else if (inputText.length > 5000) {
      setValidationError('Text must be less than 5000 characters');
    } else {
      setValidationError(null);
    }
  }, [inputText]);

  const getCharCountColor = () => {
    const length = inputText.length;
    if (length <= 4000) return 'text-emerald-400';
    if (length <= 4900) return 'text-yellow-400';
    return 'text-red-400';
  };

  const isInputValid = (): boolean => {
    const trimmedText = inputText.trim();
    return trimmedText.length >= 10 && trimmedText.length <= 5000;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsFormatting(false);
    setProgress(0);
    toast.info('Formatting cancelled');
  };

  const handleFormat = async () => {
    if (!isInputValid()) {
      toast.error(validationError || 'Please enter valid text');
      return;
    }

    if (!user) {
      toast.error('Please sign in to format text');
      setLocation('/auth');
      return;
    }

    setIsFormatting(true);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const result = await formatText(inputText.trim());

      setProgress(100);
      setOutputText(result.formatted_text);

      await refreshUser();

      if (result.credits_remaining === 0) {
        toast.warning('You have used all your credits!');
      } else if (result.credits_remaining > 0 && result.credits_remaining <= 5) {
        toast.warning(`Only ${result.credits_remaining} credits remaining`);
      } else {
        toast.success(`Text formatted successfully! ${result.credits_remaining >= 0 ? `${result.credits_remaining} credits remaining` : ''}`);
      }
    } catch (error) {
      setProgress(0);

      if (error instanceof FormatterError) {
        switch (error.code) {
          case 'AUTH_REQUIRED':
            toast.error('Please sign in again');
            setLocation('/auth');
            break;
          case 'NO_CREDITS':
            toast.error('No credits remaining. Please upgrade your plan.');
            setLocation('/pricing');
            break;
          case 'VALIDATION_ERROR':
            toast.error(error.message);
            break;
          case 'NETWORK_ERROR':
            toast.error('Network error. Please check your connection.');
            break;
          case 'SERVER_ERROR':
          default:
            toast.error('Failed to format text. Please try again.');
            break;
        }
      } else {
        toast.error('An unexpected error occurred');
      }

      console.error('Formatting error:', error);
    } finally {
      clearInterval(progressInterval);
      setIsFormatting(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Format Your Text
          </h1>
          <p className="text-slate-400">
            Transform your messages with AI-powered formatting
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Input Text</CardTitle>
                  <Badge variant={user?.plan === 'free' ? 'default' : 'success'}>
                    {user?.plan === 'free'
                      ? `${user.credits_remaining} credits remaining`
                      : 'Unlimited'
                    }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <InputTextarea
                  value={inputText}
                  onChange={setInputText}
                  disabled={isFormatting}
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-sm font-medium ${getCharCountColor()}`}>
                    {inputText.length} / 5000 characters
                  </span>
                  {validationError && (
                    <span className="text-sm text-red-400">{validationError}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Formatted Output</CardTitle>
              </CardHeader>
              <CardContent>
                <OutputTextarea
                  value={outputText}
                  disabled={isFormatting}
                />
              </CardContent>
            </Card>

            {isFormatting && (
              <Card className="border-slate-800">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <span className="animate-pulse">Formatting</span>
                        <span className="flex gap-1">
                          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                      </span>
                      <span>Estimated time: 2-5 seconds</span>
                    </div>
                    <Progress value={progress} max={100} />
                  </div>
                </CardContent>
              </Card>
            )}

            {validationError && (
              <Alert variant="danger">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-3">
              {isFormatting ? (
                <button
                  onClick={handleCancel}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 border border-slate-700"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={handleFormat}
                  disabled={!isInputValid() || isFormatting}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Format with AI
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
