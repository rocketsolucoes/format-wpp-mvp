import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Format from './pages/Format';
import History from './pages/History';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Tips from './pages/Tips';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import TestStripe from './pages/TestStripe';

/**
 * Main App Component
 *
 * Estrutura principal da aplicação com roteamento e autenticação.
 *
 * Rotas:
 * - / : Home (pública)
 * - /auth : Autenticação (pública)
 * - /pricing : Página de preços (pública)
 * - /dashboard : Dashboard do usuário (protegida)
 * - /format : Página de formatação (protegida)
 * - /history : Histórico de formatações (protegida)
 * - /settings : Configurações (protegida)
 * - /tips : Dicas e tutoriais (protegida)
 */
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <Switch>
          {/* Rota pública - Home */}
          <Route path="/" component={Home} />

          {/* Rota pública - Autenticação */}
          <Route path="/auth" component={Auth} />

          {/* Rota pública - Preços */}
          <Route path="/pricing" component={Pricing} />

          {/* Rota pública - Payment Cancel */}
          <Route path="/cancel" component={Cancel} />

          {/* Rota de teste - Stripe */}
          <Route path="/test-stripe" component={TestStripe} />

          {/* Rotas protegidas */}
          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/format">
            <ProtectedRoute>
              <Format />
            </ProtectedRoute>
          </Route>

          <Route path="/history">
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          </Route>

          <Route path="/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>

          <Route path="/tips">
            <ProtectedRoute>
              <Tips />
            </ProtectedRoute>
          </Route>

          <Route path="/success">
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          </Route>

          {/* 404 - Rota não encontrada */}
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-700 mb-4">404</h1>
                <p className="text-slate-400 mb-6">Page not found</p>
                <a href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Go back home
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </AuthProvider>
  );
}

export default App;
