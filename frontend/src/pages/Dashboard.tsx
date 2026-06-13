import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Settings, Wrench, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { data: summary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    }
  });

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  const { data: repairs } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const res = await apiClient.get('/repairs/');
      return res.data;
    }
  });

  const maintenanceData = [
    { name: 'Jan', count: 0 },
    { name: 'Feb', count: 0 },
    { name: 'Mar', count: 0 },
    { name: 'Apr', count: 0 },
    { name: 'May', count: 0 },
    { name: 'Jun', count: summary?.maintenance_this_month || 0 },
  ];

  const openRepairs = repairs?.filter((r: any) => r.status !== 'Closed').slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Machines</p>
            <Settings size={20} className="text-muted-foreground" />
          </div>
          <div className="flex items-end space-x-2">
            <h3 className="text-6xl font-black text-foreground">{summary?.total_machines || 0}</h3>
            <span className="text-primary font-bold mb-1">↑ Total</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active</p>
            <Activity size={20} className="text-muted-foreground" />
          </div>
          <div className="flex items-end space-x-2">
            <h3 className="text-6xl font-black text-foreground">{summary?.active_machines || 0}</h3>
            <span className="text-secondary font-bold mb-1">● Online</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Maintenance</p>
            <Wrench size={20} className="text-muted-foreground" />
          </div>
          <div className="flex items-end space-x-2">
            <h3 className="text-6xl font-black text-foreground">{summary?.maintenance_this_month || 0}</h3>
            <span className="text-secondary font-bold mb-1">★ Month</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] shadow-sm border border-border flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Repairs</p>
            <AlertTriangle size={20} className="text-primary" />
          </div>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-6xl font-black text-primary">{summary?.open_repairs || 0}</h3>
            <span className="text-primary/70 font-bold mb-1">▼ Open</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        </div>
      </div>
      
      {/* Middle Row: Open Repairs List & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Repairs Action List */}
        <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Action Required</h3>
              <p className="text-2xl font-black text-foreground mt-1">Open Repairs</p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{openRepairs.length} Pending</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {openRepairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground mt-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-secondary" />
                </div>
                <p className="font-bold">No open repairs!</p>
                <p className="text-sm mt-1">All machines are operational.</p>
              </div>
            ) : (
              openRepairs.map((r: any) => {
                const machine = machines?.find((m: any) => m.id === r.machine_id);
                return (
                  <div key={r.id} className="flex justify-between items-center p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                     <div>
                       <p className="font-black text-foreground uppercase tracking-widest text-sm">{machine?.machine_number || 'Unknown Machine'}</p>
                       <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-1">{r.issue_description}</p>
                     </div>
                     <div className="text-right flex-shrink-0 ml-4">
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Pending Fix</span>
                     </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</h3>
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <div className="relative pl-4 border-l-2 border-muted space-y-8 flex-1 overflow-y-auto">
            {!repairs || repairs.length === 0 ? (
              <p className="text-sm text-muted-foreground font-bold">No recent activity logged.</p>
            ) : (
              repairs
                .sort((a: any, b: any) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime())
                .slice(0, 4)
                .map((activity: any, index: number) => {
                  const machine = machines?.find((m: any) => m.id === activity.machine_id);
                  return (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-secondary rounded-full border-2 border-card"></div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                          {new Date(activity.reported_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm font-black text-foreground uppercase">{machine?.machine_number || 'Unknown Machine'} - {machine?.name}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.issue_description}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
                          activity.status !== 'Closed' 
                            ? 'bg-primary/5 text-primary border-primary/20' 
                            : 'bg-secondary/5 text-secondary border-secondary/20'
                        }`}>
                          {activity.status} Repair
                        </span>
                      </div>
                    </div>
                  )
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Maintenance Timeline */}
      <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Maintenance Volume (6 Months)</h3>
          <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">2026</span>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '1rem', border: '1px solid hsl(var(--border))', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
