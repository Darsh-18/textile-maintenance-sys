import os

FRONTEND_SRC = "frontend/src"

components = {
    "components/Layout.tsx": """import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, PenTool, Wrench, Package, Users, Settings, LogOut, FileText } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Maintenance Entry', path: '/maintenance', icon: <PenTool size={20} /> },
    { name: 'Machines', path: '/machines', icon: <Settings size={20} /> },
    { name: 'Repairs', path: '/repairs', icon: <Wrench size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
  ];

  if (user?.role === 'Admin' || user?.role === 'Supervisor') {
    navItems.push(
      { name: 'Master Data', path: '/master', icon: <Package size={20} /> }
    );
  }

  return (
    <div className="flex h-screen bg-muted/20">
      <div className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">Textile Sys</h1>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                location.pathname === item.path ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 w-full text-left rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <header className="bg-card border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold capitalize">{location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{user?.username}</span>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
""",
    "pages/Login.tsx": """import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">Textile Maintenance Sys</h1>
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition-opacity font-medium">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
""",
    "pages/Dashboard.tsx": """import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Settings, Wrench, AlertTriangle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { data: summary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    }
  });

  const chartData = [
    { name: 'Jan', maintenance: 40 },
    { name: 'Feb', maintenance: 30 },
    { name: 'Mar', maintenance: 45 },
    { name: 'Apr', maintenance: 50 },
    { name: 'May', maintenance: 35 },
    { name: 'Jun', maintenance: summary?.maintenance_this_month || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Settings size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Machines</p>
            <h3 className="text-2xl font-bold">{summary?.total_machines || 0}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground">Active Machines</p>
            <h3 className="text-2xl font-bold">{summary?.active_machines || 0}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Wrench size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground">Maintenance This Month</p>
            <h3 className="text-2xl font-bold">{summary?.maintenance_this_month || 0}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground">Open Repairs</p>
            <h3 className="text-2xl font-bold">{summary?.open_repairs || 0}</h3>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Monthly Maintenance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="maintenance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
""",
    "App.tsx": """import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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
              <Route path="maintenance" element={<div>Maintenance Entry Page Placeholder</div>} />
              <Route path="machines" element={<div>Machines Page Placeholder</div>} />
              <Route path="repairs" element={<div>Repairs Page Placeholder</div>} />
              <Route path="master" element={<div>Master Data Page Placeholder</div>} />
              <Route path="reports" element={<div>Reports Page Placeholder</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
""",
    "main.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
"""
}

for filename, content in components.items():
    path = os.path.join(FRONTEND_SRC, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Frontend components generated successfully.")
