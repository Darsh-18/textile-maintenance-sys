import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, PenTool, Wrench, Package, Users, Settings, LogOut, FileText, Database } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Maintenance Entry', path: '/maintenance', icon: <PenTool size={20} /> },
    { name: 'Machines', path: '/machines', icon: <Settings size={20} /> },
    { name: 'Repairs', path: '/repairs', icon: <Wrench size={20} /> },
    ...(user?.role === 'Admin' ? [{ name: 'Master Data', path: '/master-data', icon: <Database size={20} /> }] : []),
  ];

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Slim Sidebar (Desktop Only) */}
      <div className="hidden md:flex w-24 bg-card border-r border-border flex-col items-center py-8 z-20 shadow-2xl">
        <div className="mb-10 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] p-1 overflow-hidden">
          <img src="/surbhi-logo.png" alt="Surbhi Textile Logo" className="w-full h-full object-contain" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105'
                }`}
                title={item.name}
              >
                {item.icon}
                {/* Tooltip */}
                <span className="absolute left-16 bg-card border border-border text-foreground px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 text-xs font-bold pointer-events-none shadow-xl">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 py-2 flex justify-around items-center pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 font-bold">{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background pb-16 md:pb-0">
        
        {/* Top Header */}
        <header className="p-4 px-4 md:p-6 md:px-10 flex justify-between items-center sticky top-0 z-30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg p-1.5 shadow-md flex items-center justify-center h-10 w-20">
              <img src="/surbhi-logo.png" alt="Surbhi Textile" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-muted-foreground hidden sm:block border-l border-border pl-4">
              {location.pathname === '/' ? 'DASHBOARD' : location.pathname.split('/')[1].toUpperCase()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 bg-card border border-border rounded-full px-4 py-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Date:</span>
              <span className="text-sm font-bold text-foreground cursor-pointer hover:text-primary transition-colors">{today}</span>
            </div>
            
            <div className="relative">
              <div 
                className="hidden md:flex items-center space-x-3 bg-card border border-border rounded-full px-4 py-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="text-xs font-bold text-muted-foreground uppercase">Profile:</span>
                <span className="text-sm font-bold text-foreground hover:text-primary transition-colors">{user?.username} <span className="text-xs">▼</span></span>
              </div>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-bold text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-destructive hover:bg-muted rounded-lg transition-colors font-bold"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center shadow-lg relative group">
              <span className="font-bold text-foreground">{user?.username?.charAt(0).toUpperCase()}</span>
              {user?.role === 'Admin' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm">A</span>
              )}
            </div>
          </div>
        </header>
        
        <main className="px-4 md:px-10 pb-6 md:pb-10 pt-2 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
