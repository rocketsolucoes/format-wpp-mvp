import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { ExtensionBadgeDetector } from './components/ExtensionBadgeDetector';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Format from './pages/Format';
import History from './pages/History';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import TestStripe from './pages/TestStripe';
import AdminRoute from './components/AdminRoute';
import AdminPrompts from './pages/admin/Prompts';

const protectedRoutes = ['/dashboard', '/format', '/history', '/settings', '/success', '/admin/prompts'];

/**
 * Main App Component
 */
function AppContent() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isProtectedRoute = protectedRoutes.includes(location);

  const shouldShowHeader = !isProtectedRoute && !(location === '/pricing' && user);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {shouldShowHeader && <Header />}
      <ExtensionBadgeDetector />

        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={Auth} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/cancel" component={Cancel} />
          <Route path="/test-stripe" component={TestStripe} />
          
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

          <Route path="/success">
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/prompts">
            <ProtectedRoute>
              <AdminRoute>
                <AdminPrompts />
              </AdminRoute>
            </ProtectedRoute>
          </Route>

          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                <p className="text-muted-foreground mb-6">Página não encontrada</p>
                <a href="/" className="text-primary hover:text-primary/80 transition-colors">
                  Voltar para o início
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
