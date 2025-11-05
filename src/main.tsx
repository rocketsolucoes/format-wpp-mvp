import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider, setToastFunction, useToast } from './components/ui/Toaster';

/**
 * Component que configura o toast após o mount
 */
const AppWithToast = () => {
  const { showToast } = useToast();

  // Configura a função global assim que o componente montar
  useEffect(() => {
    setToastFunction(showToast);
  }, [showToast]);

  return <App />;
};

/**
 * Wrapper principal que provê o contexto do toast
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppWithToast />
    </ToastProvider>
  </StrictMode>
);
