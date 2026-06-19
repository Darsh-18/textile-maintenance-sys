import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MaintenanceEntry from './pages/MaintenanceEntry';
import Machines from './pages/Machines';

import Reports from './pages/Reports';
import Repairs from './pages/Repairs';
import MasterData from './pages/MasterData';
import MachineHistory from './pages/MachineHistory';
import ServiceHistory from './pages/ServiceHistory';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="maintenance" element={<MaintenanceEntry />} />
              <Route path="machines" element={<Machines />} />
              <Route path="machines/:id" element={<MachineHistory />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="master-data" element={<MasterData />} />
              <Route path="services/:id" element={<ServiceHistory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
