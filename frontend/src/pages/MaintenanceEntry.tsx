import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const MaintenanceEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceData, setServiceData] = useState({ service_name: '', description: '', interval_days: 30 });

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient.get('/services/');
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/maintenance/', data);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setSelectedMachine('');
      setSelectedServices([]);
      setRemarks('');
      setTimeout(() => setSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const createService = useMutation({
    mutationFn: async (newService: any) => (await apiClient.post('/services/', newService)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedServices(prev => [...prev, data.id]);
      setIsServiceModalOpen(false);
      setServiceData({ service_name: '', description: '', interval_days: 30 });
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: number) => await apiClient.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: any) => {
      alert("Failed to delete service: " + (error.response?.data?.detail || error.message));
    }
  });

  const handleServiceToggle = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || selectedServices.length === 0) return;
    submitMutation.mutate({
      machine_id: parseInt(selectedMachine),
      remarks,
      items: selectedServices
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Fast Maintenance Entry</h2>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} />
          <span>Maintenance recorded successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card p-10 rounded-[2rem] shadow-xl space-y-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Select Machine</label>
          <select 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full p-4 border border-border rounded-full bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm font-bold text-foreground uppercase tracking-widest text-sm"
            required
          >
            <option value="">-- Choose Machine --</option>
            {machines?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.machine_number} - {m.name}</option>
            ))}
          </select>
        </div>

        {selectedMachine && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Check Completed Services</label>
              {user?.role === 'Admin' && (
                <button type="button" onClick={() => setIsServiceModalOpen(true)} className="text-xs font-black uppercase tracking-widest text-primary hover:text-background hover:bg-primary transition-colors bg-primary/10 px-4 py-2 rounded-full">+ Add Service</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services?.map((s: any) => (
                <div 
                  key={s.id} 
                  className={`flex items-start justify-between p-5 border border-border rounded-2xl transition-all duration-300 ${selectedServices.includes(s.id) ? 'bg-primary/10 border-primary shadow-md scale-[1.02]' : 'hover:bg-muted/50 hover:border-border'}`}
                >
                  <label className="flex items-start space-x-4 cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary focus:ring-offset-background"
                      checked={selectedServices.includes(s.id)}
                      onChange={() => handleServiceToggle(s.id)}
                    />
                    <div>
                      <p className="font-black text-foreground uppercase tracking-wide">{s.service_name}</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">{s.description}</p>
                    </div>
                  </label>
                  {user?.role === 'Admin' && (
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to remove the ${s.service_name} service?`)) {
                          deleteService.mutate(s.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-2 ml-2 bg-background rounded-full transition-colors border border-border"
                      title="Remove Service"
                      disabled={deleteService.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={selectedMachine ? "animate-in fade-in duration-700" : ""}>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Remarks (Optional)</label>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full p-5 border border-border rounded-2xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[140px] transition-all shadow-sm resize-y font-medium text-foreground"
            placeholder="E.g., Guide plate worn out, needs attention soon."
          />
        </div>

        <button 
          type="submit" 
          disabled={!selectedMachine || selectedServices.length === 0 || submitMutation.isPending}
          className="w-full bg-primary text-primary-foreground py-4 rounded-full font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
        >
          {submitMutation.isPending ? 'Recording Entry...' : 'Submit Maintenance Record'}
        </button>
      </form>

      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background p-6 rounded-xl w-full max-w-sm shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Service</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createService.mutate(serviceData); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Service Name</label>
                <input required type="text" value={serviceData.service_name} onChange={e => setServiceData({...serviceData, service_name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Filter Change" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input type="text" value={serviceData.description} onChange={e => setServiceData({...serviceData, description: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <button type="submit" disabled={createService.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium mt-2">Save Service</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceEntry;
