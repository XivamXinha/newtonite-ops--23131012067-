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

  // Auto-switch to Admin Console if user is Admin on login
  React.useEffect(() => {
    if (user?.role === 'ADMIN' && currentPage === 'dashboard') {
      setCurrentPage('admin-console');
    }
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
    setSelectedItemId(id);
    setCurrentPage('item-detail');
  };

  const handleNavChange = (page: 'dashboard' | 'work-items' | 'admin-console') => {
    setCurrentPage(page);
    setSelectedItemId(null);
  };

  return (
    <div className="app-container">
      <Navbar currentPage={currentPage} setCurrentPage={handleNavChange} />

      <main className="main-content">
        {currentPage === 'admin-console' && (
          <AdminDashboardPage onSelectItem={handleSelectItem} />
        )}

        {currentPage === 'dashboard' && <DashboardPage onSelectItem={handleSelectItem} />}

        {currentPage === 'work-items' && <WorkItemsPage onSelectItem={handleSelectItem} />}

        {currentPage === 'item-detail' && selectedItemId && (
          <WorkItemDetailPage
            itemId={selectedItemId}
            onBack={() => setCurrentPage(user?.role === 'ADMIN' ? 'admin-console' : 'work-items')}
          />
        )}
      </main>
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
