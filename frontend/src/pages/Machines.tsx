import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Power, Calendar, Settings, X, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Machines = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    machine_number: '',
    name: '',
    type: '',
    department: '',
    installation_date: ''
  });

  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await apiClient.get('/machines/');
      return res.data;
    }
  });

  const createMachine = useMutation({
    mutationFn: async (newMachine: any) => {
      if (editingId) {
        const res = await apiClient.put(`/machines/${editingId}`, newMachine);
        return res.data;
      } else {
        const res = await apiClient.post('/machines/', newMachine);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ machine_number: '', name: '', type: '', department: '', installation_date: '' });
    }
  });

  const deleteMachine = useMutation({
    mutationFn: async (id: number) => await apiClient.delete(`/machines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMachine.mutate(formData);
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setFormData({
      machine_number: m.machine_number,
      name: m.name,
      type: m.type,
      department: m.department,
      installation_date: m.installation_date
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Machine Registry</h2>
        {user?.role === 'Admin' && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ machine_number: '', name: '', type: '', department: '', installation_date: '' });
              setIsModalOpen(true);
            }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-widest"
          >
            + Add Machine
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines?.map((m: any) => (
          <div key={m.id} className="bg-card rounded-[2rem] p-6 shadow-xl hover:bg-muted/30 transition-colors border border-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-2xl text-foreground tracking-tight">{m.machine_number}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase mt-1">{m.name}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full shadow-sm ${m.status === 'Active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                  {m.status}
                </span>
                {user?.role === 'Admin' && (
                  <div className="flex items-center space-x-1 mt-2">
                    <button onClick={() => handleEdit(m)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors border border-transparent hover:border-border">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${m.machine_number}?`)) {
                          deleteMachine.mutate(m.id);
                        }
                      }} 
                      className="text-muted-foreground hover:text-destructive hover:bg-muted p-2 rounded-full transition-colors border border-transparent hover:border-border"
                      disabled={deleteMachine.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs w-20">Type</span> 
                <span className="font-bold text-foreground">{m.type}</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-secondary mr-3"></div>
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs w-20">Dept</span> 
                <span className="font-bold text-foreground">{m.department}</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mr-3"></div>
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs w-20">Install</span> 
                <span className="font-bold text-foreground">{m.installation_date}</span>
              </div>
            </div>
            
            <Link to={`/machines/${m.id}`} className="block w-full text-center bg-muted/30 hover:bg-primary text-foreground hover:text-background py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all duration-300">
              View History
            </Link>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-full max-w-md shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Machine' : 'Add New Machine'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine Number</label>
                <input required type="text" value={formData.machine_number} onChange={e => setFormData({...formData, machine_number: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. M/C NO 17" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name / Configuration</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. 3508" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Embroidery/Textile" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Production" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Installation Date</label>
                <input required type="date" value={formData.installation_date} onChange={e => setFormData({...formData, installation_date: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <button type="submit" disabled={createMachine.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                {createMachine.isPending ? 'Saving...' : 'Save Machine'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Machines;
