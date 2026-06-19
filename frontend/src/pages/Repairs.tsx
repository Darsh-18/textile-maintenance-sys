import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Repairs = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    machine_id: '',
    remarks: '',
    sent_date: new Date().toISOString().split('T')[0],
  });
  
  const { data: repairs, isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const res = await apiClient.get('/repairs/');
      return res.data;
    }
  });

  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: async () => (await apiClient.get('/machines/')).data });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiClient.put(`/repairs/${id}/status?status=${encodeURIComponent(status)}`);
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['repairs'] });
      const previousRepairs = queryClient.getQueryData(['repairs']);
      queryClient.setQueryData(['repairs'], (old: any) => 
        old?.map((r: any) => r.id === id ? { ...r, status } : r)
      );
      return { previousRepairs };
    },
    onError: (err, newRepair, context) => {
      if (context?.previousRepairs) {
        queryClient.setQueryData(['repairs'], context.previousRepairs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    }
  });

  const deleteRepair = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/repairs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    }
  });

  const createRepair = useMutation({
    mutationFn: async (newRepair: any) => {
      if (editingId) {
        const res = await apiClient.put(`/repairs/${editingId}`, newRepair);
        return res.data;
      } else {
        const res = await apiClient.post('/repairs/', newRepair);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ machine_id: '', part_id: '', vendor_id: '', quantity: 1, sent_date: new Date().toISOString().split('T')[0] });
    }
  });



  const statuses = ["Sent for Repair", "Under Repair", "Ready for Collection", "Returned", "Installed", "Closed"];

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this repair request?')) {
      deleteRepair.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRepair.mutate(formData);
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({
      machine_id: r.machine_id,
      remarks: r.remarks || '',
      sent_date: r.sent_date.split('T')[0],
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Repair Requests</h2>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ machine_id: '', remarks: '', sent_date: new Date().toISOString().split('T')[0] });
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
        >
          + New Repair
        </button>
      </div>

      <div className="bg-card rounded-[2rem] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-border">
            <tr>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">ID</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Machine</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Error Description</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Sent Date</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Status</th>
              <th className="p-6 font-bold text-muted-foreground uppercase tracking-widest text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairs?.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground font-bold uppercase tracking-widest">No repairs found.</td></tr>
            )}
            {repairs?.map((r: any) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                <td className="p-6 font-bold text-muted-foreground">#{r.id}</td>
                <td className="p-6 font-black text-foreground">{r.machine?.machine_number}</td>
                <td className="p-6 font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[200px]">{r.remarks || 'No description'}</td>
                <td className="p-6 font-bold text-muted-foreground">{format(new Date(r.sent_date), 'MMM d, yyyy')}</td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm ${
                    r.status === 'Closed' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center space-x-3">
                    <select 
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="border border-border rounded-full px-4 py-2 text-xs bg-background focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase tracking-widest"
                      disabled={user?.role !== 'Admin'}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => handleEdit(r)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors">
                      <Edit2 size={16} />
                    </button>
                    {user?.role === 'Admin' && (
                      <button 
                        onClick={() => handleDelete(r.id)} 
                        disabled={deleteRepair.isPending}
                        className="text-primary/70 hover:text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-full max-w-md shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Repair Request' : 'New Repair Request'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine</label>
                <select required value={formData.machine_id} onChange={e => setFormData({...formData, machine_id: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none">
                  <option value="" disabled>Select Machine</option>
                  {machines?.map((m: any) => <option key={m.id} value={m.id}>{m.machine_number} - {m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Error Description</label>
                <textarea required value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none min-h-[100px]" placeholder="Describe the error or reason for breakdown..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reported Date</label>
                <input required type="date" value={formData.sent_date} onChange={e => setFormData({...formData, sent_date: e.target.value})} className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <button type="submit" disabled={createRepair.isPending} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
                {createRepair.isPending ? 'Saving...' : 'Save Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
