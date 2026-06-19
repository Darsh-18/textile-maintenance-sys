import React, { useState } from 'react';
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
      <div className="bg-card p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-border relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center justify-center mb-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-md flex items-center justify-center h-20 w-40 p-3 mb-4">
            <img src="/surbhi-logo.png" alt="Surbhi Textile" className="h-full w-full object-contain scale-110" />
          </div>
          <h1 className="text-2xl font-black text-center uppercase tracking-widest text-foreground">Surbhi <span className="text-primary">Textile</span></h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Maintenance System</p>
        </div>
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
