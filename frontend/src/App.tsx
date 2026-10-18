import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkItemsPage } from './pages/WorkItemsPage';
import { WorkItemDetailPage } from './pages/WorkItemDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 5000,
    },
  },
});

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'work-items' | 'item-detail' | 'admin-console'>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [previousPage, setPreviousPage] = useState<'dashboard' | 'work-items' | 'admin-console'>('dashboard');

  // Auto-switch to Admin Console if user is Admin on login, and redirect non-admins away from admin-console
  React.useEffect(() => {
    if (user?.role === 'ADMIN' && currentPage === 'dashboard') {
      setCurrentPage('admin-console');
      setPreviousPage('admin-console');
    } else if (user && user.role !== 'ADMIN' && currentPage === 'admin-console') {
      setCurrentPage('dashboard');
      setPreviousPage('dashboard');
    }
  }, [user, currentPage]);

  // Handle browser back/forward button events seamlessly
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page === 'item-detail' && e.state.itemId) {
        setSelectedItemId(e.state.itemId);
        setCurrentPage('item-detail');
      } else if (e.state && e.state.page) {
        setSelectedItemId(null);
        setCurrentPage(e.state.page);
      } else {
        setSelectedItemId(null);
        setCurrentPage(user?.role === 'ADMIN' ? 'admin-console' : 'dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          fontWeight: 600,
        }}
      >
        Initializing Newtonite Platform...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectItem = (id: string) => {
    if (currentPage !== 'item-detail') {
      setPreviousPage(currentPage);
    }
    setSelectedItemId(id);
    setCurrentPage('item-detail');
    try {
      window.history.pushState({ page: 'item-detail', itemId: id }, '', window.location.href);
    } catch {
      // ignore
    }
  };

  const handleBack = () => {
    setSelectedItemId(null);
    const fallback = user?.role === 'ADMIN' ? 'admin-console' : 'dashboard';
    setCurrentPage(previousPage || fallback);
  };

  const handleNavChange = (page: 'dashboard' | 'work-items' | 'admin-console') => {
    setCurrentPage(page);
    setPreviousPage(page);
    setSelectedItemId(null);
    try {
      window.history.pushState({ page }, '', window.location.href);
    } catch {
      // ignore
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentPage={currentPage} setCurrentPage={handleNavChange} />

      {currentPage === 'admin-console' ? (
        <div style={{ flex: 1, display: 'flex', width: '100%', minHeight: 'calc(100vh - 61px)' }}>
          <AdminDashboardPage onSelectItem={handleSelectItem} />
        </div>
      ) : currentPage === 'dashboard' ? (
        <div style={{ flex: 1, display: 'flex', width: '100%', minHeight: 'calc(100vh - 61px)' }}>
          <DashboardPage onSelectItem={handleSelectItem} />
        </div>
      ) : (
        <main className="main-content">
          {currentPage === 'work-items' && <WorkItemsPage onSelectItem={handleSelectItem} />}

          {currentPage === 'item-detail' && (
            selectedItemId ? (
              <WorkItemDetailPage
                itemId={selectedItemId}
                onBack={handleBack}
              />
            ) : (
              <DashboardPage onSelectItem={handleSelectItem} />
            )
          )}
        </main>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
